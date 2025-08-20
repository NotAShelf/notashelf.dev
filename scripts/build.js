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
//      or `node build.js --all`
function parseArgs(argv) {
  let all = false;
  let workspaceName = undefined;
  let npmScript = "build";
  let extraArgs = [];
  for (let i = 2; i < argv.length; ++i) {
    if (argv[i] === "--all") {
      all = true;
    } else if (!workspaceName && !argv[i].startsWith("--")) {
      workspaceName = argv[i];
    } else if (!npmScript && !argv[i].startsWith("--")) {
      npmScript = argv[i];
    } else if (argv[i] === "--outDir" && argv[i + 1]) {
      extraArgs.push("--outDir", argv[i + 1]);
      i++;
    } else if (argv[i].startsWith("--outDir=")) {
      extraArgs.push(argv[i]);
    }
  }
  return { all, workspaceName, npmScript, extraArgs };
}

async function main() {
  const { all, workspaceName, npmScript, extraArgs } = parseArgs(process.argv);

  const workspaceGlobs = await getWorkspaces(rootDir);
  const workspaceDirs = resolveWorkspaceDirs(workspaceGlobs, rootDir);

  let targets = [];
  if (all) {
    targets = workspaceDirs;
  } else if (workspaceName) {
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
    console.error(`[build] Please specify a workspace to build or use --all`);
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

  // Build each selected workspace and collect results
  const results = [];
  for (const wsDir of targets) {
    const wsPkgName =
      getWorkspacePkgName(wsDir) || wsDir.replace(rootDir + "/", "");
    try {
      await runWorkspaceBuild(wsDir, [npmScript, ...extraArgs]);
      results.push({ name: wsPkgName, status: "success" });
    } catch (err) {
      results.push({ name: wsPkgName, status: "fail", error: err });
    }
  }

  // Print summary reportF
  if (all) {
    printBuildReport(results);
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

function printBuildReport(results) {
  const pad = (str, len) => str + " ".repeat(Math.max(0, len - str.length));
  const maxName = Math.max(...results.map((r) => r.name.length), 12);
  const summary = results
    .map((r) => {
      const status =
        r.status === "success"
          ? "\x1b[32mSUCCESS\x1b[0m"
          : "\x1b[31mFAIL\x1b[0m";
      return `  ${pad(r.name, maxName)}  ${status}`;
    })
    .join("\n");

  const failed = results.filter((r) => r.status === "fail");
  const passed = results.filter((r) => r.status === "success");

  console.log("\n" + "=".repeat(6) + " Build Summary " + "=".repeat(6));
  console.log(summary);
  console.log("=".repeat(30));
  console.log(
    `  Total: ${results.length}  Passed: ${passed.length}  Failed: ${failed.length}`,
  );
  if (failed.length > 0) {
    console.log("\nFailed builds:");
    for (const r of failed) {
      console.log(`  - ${r.name}`);
      if (r.error && r.error.message) {
        console.log(`      ${r.error.message}`);
      }
    }
    process.exit(1);
  }
}

main();
