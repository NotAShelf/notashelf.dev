import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { readFile } from "fs/promises";

/**
 * Reads the workspaces from the nearest package.json.
 * @param {string} rootDir - The root directory to search for package.json.
 * @returns {Promise<string[]>} - Array of workspace globs.
 */
export async function getWorkspaces(rootDir) {
  const pkgPath = join(rootDir, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  } catch {
    return [];
  }
  if (pkg && Array.isArray(pkg.workspaces)) {
    return pkg.workspaces;
  }
  if (pkg && pkg.workspaces && Array.isArray(pkg.workspaces.packages)) {
    return pkg.workspaces.packages;
  }
  return [];
}

/**
 * Resolves workspace directories from globs.
 * Only supports simple globs like "apps/*" or "packages/*".
 * @param {string[]} globs - Workspace globs.
 * @param {string} rootDir - Root directory.
 * @returns {string[]} - Absolute paths to workspace directories.
 */
export function resolveWorkspaceDirs(globs, rootDir) {
  const dirs = [];
  for (const glob of globs) {
    if (glob.endsWith("/*")) {
      const base = join(rootDir, glob.slice(0, -2));
      if (existsSync(base)) {
        for (const name of readdirSync(base)) {
          const dir = join(base, name);
          if (
            existsSync(join(dir, "package.json")) ||
            existsSync(join(dir, "Cargo.toml"))
          ) {
            dirs.push(dir);
          }
        }
      }
    } else {
      const dir = join(rootDir, glob);
      if (existsSync(dir)) {
        dirs.push(dir);
      }
    }
  }
  return dirs;
}

/**
 * Finds WASM packages in a given root directory.
 * @param {string} rootDir
 * @returns {string[]} - Absolute paths to WASM package directories.
 */
export function findWasmPackages(rootDir) {
  const pkgsDir = join(rootDir, "packages");
  if (!existsSync(pkgsDir)) return [];
  return readdirSync(pkgsDir)
    .map((name) => join(pkgsDir, name))
    .filter(
      (dir) =>
        existsSync(join(dir, "Cargo.toml")) && existsSync(join(dir, "src")),
    );
}

/**
 * Returns the latest mtime in a directory tree.
 * @param {string} dir
 * @returns {number}
 */
function latestMtime(dir) {
  let m = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    m = Math.max(m, e.isDirectory() ? latestMtime(p) : statSync(p).mtimeMs);
  }
  return m;
}

/**
 * Determines if a WASM package needs to be rebuilt.
 * @param {string} wasmDir
 * @returns {boolean}
 */
function needsBuild(wasmDir) {
  const src = join(wasmDir, "src");
  const pkg = join(wasmDir, "pkg");
  if (!existsSync(pkg)) return true;
  let srcTime = existsSync(src) ? latestMtime(src) : 0;
  for (const f of ["Cargo.toml", "Cargo.lock"])
    if (existsSync(join(wasmDir, f)))
      srcTime = Math.max(srcTime, statSync(join(wasmDir, f)).mtimeMs);
  return srcTime > latestMtime(pkg);
}

/**
 * Builds a single WASM package asynchronously.
 * @param {string} wasmDir
 * @param {boolean} dev
 * @returns {Promise<boolean>}
 */
export function buildWasm(wasmDir, dev = false) {
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

/**
 * Builds all WASM packages in parallel.
 * @param {string[]} wasmDirs
 * @param {boolean} dev
 * @returns {Promise<void>}
 */
export async function buildAllWasm(wasmDirs, dev = false) {
  await Promise.all(wasmDirs.map((dir) => buildWasm(dir, dev)));
}
