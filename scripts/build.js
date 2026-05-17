#!/usr/bin/env node

import { join, dirname, isAbsolute } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { readFileSync, cpSync, mkdtempSync, rmSync } from "fs";
import { getWorkspaces, resolveWorkspaceDirs } from "./utils/workspace.js";

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
  let outDir = undefined;
  for (let i = 2; i < argv.length; ++i) {
    if (argv[i] === "--all") {
      all = true;
    } else if (!workspaceName && !argv[i].startsWith("--")) {
      workspaceName = argv[i];
    } else if (!npmScript && !argv[i].startsWith("--")) {
      npmScript = argv[i];
    } else if (argv[i] === "--outDir" && argv[i + 1]) {
      outDir = argv[++i];
    } else if (argv[i].startsWith("--outDir=")) {
      outDir = argv[i].slice("--outDir=".length);
    }
  }
  return { all, workspaceName, npmScript, extraArgs, outDir };
}

async function main() {
  const { all, workspaceName, npmScript, extraArgs, outDir } = parseArgs(
    process.argv,
  );

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

  // Astro uses rename() internally to move prerendered assets into outDir.
  // If outDir is outside the build root (e.g. a Nix store path), rename()
  // fails with EXDEV across mount boundaries. Build into a local temp dir
  // first, then copy the result to the real outDir.
  const crossDevice =
    outDir !== undefined &&
    isAbsolute(outDir) &&
    !outDir.startsWith(rootDir + "/");

  // Build each selected workspace and collect results
  const results = [];
  for (const wsDir of targets) {
    const wsPkgName =
      getWorkspacePkgName(wsDir) || wsDir.replace(rootDir + "/", "");
    let tempDir = null;
    try {
      let buildOutDir = outDir;
      if (crossDevice) {
        tempDir = mkdtempSync(join(wsDir, ".build-out-"));
        buildOutDir = tempDir;
      }
      const outDirArgs =
        buildOutDir !== undefined ? ["--outDir", buildOutDir] : [];
      await runWorkspaceBuild(wsDir, [npmScript, ...extraArgs, ...outDirArgs]);
      if (tempDir) {
        cpSync(tempDir, outDir, { recursive: true });
        rmSync(tempDir, { recursive: true, force: true });
        tempDir = null;
      }
      results.push({ name: wsPkgName, status: "success" });
    } catch (err) {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
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
