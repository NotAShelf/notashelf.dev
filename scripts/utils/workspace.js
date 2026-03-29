import { existsSync, readdirSync } from "fs";
import { join } from "path";
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
          if (existsSync(join(dir, "package.json"))) {
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
