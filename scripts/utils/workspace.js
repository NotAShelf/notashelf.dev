import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { readFile } from "fs/promises";

/**
 * Reads the workspaces from the nearest package.json or pnpm-workspace.yaml.
 * @param {string} rootDir - The root directory to search.
 * @returns {Promise<string[]>} - Array of workspace globs.
 */
export async function getWorkspaces(rootDir) {
  const pkgPath = join(rootDir, "package.json");
  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    if (pkg && Array.isArray(pkg.workspaces)) {
      return pkg.workspaces;
    }
  } catch {
    // package.json may not exist or be unreadable
  }

  const workspaceYamlPath = join(rootDir, "pnpm-workspace.yaml");
  try {
    const yaml = readFileSync(workspaceYamlPath, "utf8");
    const packages = yaml.match(/^packages:\s*\n((?:\s*-\s*.+\n?)*)/m);
    if (packages && packages[1]) {
      return packages[1]
        .split("\n")
        .map((line) => line.trim().replace(/^-\s*/, ""))
        .filter(Boolean);
    }
  } catch {
    // pnpm-workspace.yaml may not exist
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
