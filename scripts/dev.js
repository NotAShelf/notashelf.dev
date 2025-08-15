#!/usr/bin/env node

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import {
  getWorkspaces,
  resolveWorkspaceDirs,
  findWasmPackages,
  buildAllWasm,
} from "./utils/workspace.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function main() {
  const workspaceName = process.argv[2];
  const npmScript = process.argv[3] || "dev";

  // Discover workspaces
  const workspaceGlobs = await getWorkspaces(rootDir);
  const workspaceDirs = resolveWorkspaceDirs(workspaceGlobs, rootDir);

  // Select workspace to run dev in
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
      console.error(`[dev] No workspace found matching: ${workspaceName}`);
      console.error(
        `[dev] Available workspaces: ${workspaceDirs.map((d) => d.replace(rootDir + "/", "")).join(", ")}`,
      );
      process.exit(1);
    }
  } else {
    console.error(`[dev] Please specify a workspace to run dev in`);
    console.error(
      `[dev] Available workspaces: ${workspaceDirs.map((d) => d.replace(rootDir + "/", "")).join(", ")}`,
    );
    process.exit(1);
  }

  // Build WASM packages by default
  const wasmPkgs = findWasmPackages(rootDir);
  if (wasmPkgs.length > 0) {
    await buildAllWasm(wasmPkgs, false);
  }

  // Run dev for each selected workspace (first one only, for typical dev)
  // If you want to support running multiple dev servers, you can remove the [0] index.
  await runWorkspaceDev(targets[0], [npmScript]);
}

function runWorkspaceDev(wsDir, cmdArr) {
  return new Promise((resolve, reject) => {
    const wsName = wsDir.replace(`${rootDir}/`, "");
    console.log(
      `[dev] Running dev in workspace: ${wsName} (${cmdArr.join(" ")})`,
    );
    const child = spawn("pnpm", ["--filter", `./${wsName}`, "run", ...cmdArr], {
      cwd: rootDir,
      stdio: "inherit",
    });

    process.on("SIGINT", () => {
      child.kill();
      process.exit(0);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[dev] Workspace dev failed: ${wsName}`);
        reject(new Error(`Dev failed for ${wsName}`));
      } else {
        resolve();
      }
    });
    child.on("error", (err) => {
      console.error(`[dev] Error: ${err.message}`);
      reject(err);
    });
  });
}

main();
