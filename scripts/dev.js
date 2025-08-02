#!/usr/bin/env node

const { spawn } = require("child_process");
const { existsSync, readdirSync } = require("fs");
const path = require("path");

const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const [, , workspace, ...cmd] = process.argv;
if (!workspace || cmd.length === 0) {
  console.error("Usage: node scripts/dev.js <workspace> <command...>");
  process.exit(1);
}

function latestMtime(dir) {
  let m = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    m = Math.max(
      m,
      e.isDirectory() ? latestMtime(p) : require("fs").statSync(p).mtimeMs,
    );
  }
  return m;
}

function needsBuild(wasmDir) {
  const src = path.join(wasmDir, "src");
  const pkg = path.join(wasmDir, "pkg");
  if (!existsSync(pkg)) return true;
  let srcTime = existsSync(src) ? latestMtime(src) : 0;
  for (const f of ["Cargo.toml", "Cargo.lock"])
    if (existsSync(path.join(wasmDir, f)))
      srcTime = Math.max(
        srcTime,
        require("fs").statSync(path.join(wasmDir, f)).mtimeMs,
      );
  return srcTime > latestMtime(pkg);
}

function buildWasm(wasmDir, dev = false) {
  return new Promise((resolve) => {
    if (!existsSync(wasmDir)) return resolve(false);
    if (!needsBuild(wasmDir)) {
      console.log(`[wasm] Up to date: ${wasmDir}`);
      return resolve(false);
    }
    console.log(`[wasm] Building: ${wasmDir}`);
    const args = [
      "build",
      "--target",
      "web",
      "--out-dir",
      "pkg",
      "--out-name",
      "wasm-utils",
    ];
    if (dev) args.push("--dev");
    const p = spawn("wasm-pack", args, { cwd: wasmDir, stdio: "inherit" });
    p.on("close", (code) => {
      if (code !== 0) console.warn(`[wasm] Build failed: ${wasmDir}`);
      resolve(code === 0);
    });
    p.on("error", (err) => {
      console.warn(`[wasm] Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function buildAllWasm(root) {
  const pkgs = [];
  const pkgsDir = path.join(root, "packages");
  if (existsSync(pkgsDir)) {
    for (const name of readdirSync(pkgsDir)) {
      const dir = path.join(pkgsDir, name);
      if (
        existsSync(path.join(dir, "Cargo.toml")) &&
        existsSync(path.join(dir, "src"))
      ) {
        pkgs.push(dir);
      }
    }
  }
  for (const dir of pkgs) await buildWasm(dir, true);
}

async function main() {
  await buildAllWasm(rootDir);
  runDev(workspace, cmd);
}

function runDev(ws, args) {
  const filter =
    ws.startsWith("apps/") || ws.startsWith("packages/") ? ws : `apps/${ws}`;
  const child = spawn("pnpm", ["--filter", `./${filter}`, "run", ...args], {
    cwd: rootDir,
    stdio: "inherit",
  });
  process.on("SIGINT", () => {
    child.kill();
    process.exit(0);
  });
  child.on("close", (code) => process.exit(code));
}

main();
