#!/usr/bin/env node

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import {
  getWorkspaces,
  resolveWorkspaceDirs,
  findWasmPackages,
  buildAllWasm,
} from "./utils/workspace.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Parse CLI args.
// Ex: `node build.js <workspace> [npmScript] [--outDir foo]`
function parseArgs(argv) {
  let workspaceName = argv[2];
  let npmScript = argv[3] && !argv[3].startsWith("--") ? argv[3] : "build";
  let extraArgs = [];
  for (let i = 2; i < argv.length; ++i) {
    if (argv[i] === "--outDir" && argv[i + 1]) {
      extraArgs.push("--outDir", argv[i + 1]);
      i++;
    } else if (argv[i].startsWith("--outDir=")) {
      extraArgs.push(argv[i]);
    }
  }
  return { workspaceName, npmScript, extraArgs };
}

async function main() {
  const { workspaceName, npmScript, extraArgs } = parseArgs(process.argv);

  const workspaceGlobs = await getWorkspaces(rootDir);
  const workspaceDirs = resolveWorkspaceDirs(workspaceGlobs, rootDir);

  // Select workspace to build
  let targets = [];
  if (workspaceName) {
    const w = workspaceName.toLowerCase();
    targets = workspaceDirs.filter((dir) => {
      const dirName = dir.replace(rootDir + "/", "").toLowerCase();
      return (
        dirName === `apps/${w}` || dirName === `packages/${w}` || dirName === w
      );
    });
    if (targets.length === 0) {
      console.error(`[build] No workspace found matching: ${workspaceName}`);
      console.error(
        `[build] Available workspaces: ${workspaceDirs.map((d) => d.replace(rootDir + "/", "")).join(", ")}`,
      );
      process.exit(1);
    }
  } else {
    console.error(`[build] Please specify a workspace to build`);
    console.error(
      `[build] Available workspaces: ${workspaceDirs.map((d) => d.replace(rootDir + "/", "")).join(", ")}`,
    );
    process.exit(1);
  }

  // Build WASM packages by default
  const wasmPkgs = findWasmPackages(rootDir);
  if (wasmPkgs.length > 0) {
    await buildAllWasm(wasmPkgs, false);
  }

  // Build each selected workspace
  for (const wsDir of targets) {
    await runWorkspaceBuild(wsDir, [npmScript, ...extraArgs]);
  }
}

function getWorkspacePkgName(wsDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(wsDir, "package.json"), "utf8"));
    return pkg.name;
  } catch {
    return null;
  }
}

function runWorkspaceBuild(wsDir, cmdArr) {
  return new Promise((resolve, reject) => {
    const wsPkgName = getWorkspacePkgName(wsDir);
    if (!wsPkgName) {
      console.log(`[build] No package.json or name for workspace: ${wsDir}`);
      return resolve();
    }
    console.log(
      `[build] Building workspace: ${wsPkgName} (${cmdArr.join(" ")})`,
    );
    const child = spawn("pnpm", ["--filter", wsPkgName, "run", ...cmdArr], {
      cwd: rootDir,
      stdio: "inherit",
    });
    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[build] Workspace build failed: ${wsPkgName}`);
        reject(new Error(`Build failed for ${wsPkgName}`));
      } else {
        resolve();
      }
    });
    child.on("error", (err) => {
      console.error(`[build] Error: ${err.message}`);
      reject(err);
    });
  });
}

main();
