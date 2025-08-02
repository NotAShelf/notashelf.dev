const { spawn } = require("child_process");
const { existsSync, statSync, readdirSync } = require("fs");
const path = require("path");

function latestMtime(dir) {
  let m = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    m = Math.max(m, e.isDirectory() ? latestMtime(p) : statSync(p).mtimeMs);
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
      srcTime = Math.max(srcTime, statSync(path.join(wasmDir, f)).mtimeMs);
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

module.exports = { buildWasm };
