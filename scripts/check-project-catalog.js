import fs from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url).pathname;
const projectsDir = path.join(root, "apps/notashelf.dev/src/data/projects");
const exemptionsFile = path.join(root, ".github/project-catalog-exemptions.json");
const yearMs = 365 * 24 * 60 * 60 * 1000;
const staleBefore = new Date(Date.now() - yearMs);

function parseToml(source) {
  const data = {};

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (value === "true" || value === "false") {
      data[key] = value === "true";
    } else if (value.startsWith('"') && value.endsWith('"')) {
      data[key] = value.slice(1, -1);
    } else {
      data[key] = value;
    }
  }

  return data;
}

function githubRepoFromUrl(sourceUrl) {
  const match = sourceUrl.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/?#].*)?$/,
  );
  if (!match) return null;

  return `${match[1]}/${match[2]}`.toLowerCase();
}

async function readExemptions() {
  try {
    const source = await fs.readFile(exemptionsFile, "utf8");
    return new Set(JSON.parse(source).map((r) => r.toLowerCase()));
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    throw error;
  }
}

async function github(pathname) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "notashelf-dev-project-catalog-check",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${pathname}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`${pathname}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function listOwnerRepos(owner) {
  const repos = [];

  for (let page = 1; ; page++) {
    const batch = await github(
      `/users/${owner}/repos?type=owner&per_page=100&page=${page}`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  return repos;
}

async function main() {
  const files = (await fs.readdir(projectsDir))
    .filter((file) => file.endsWith(".toml"))
    .sort();
  const exemptions = await readExemptions();
  const catalogedRepos = new Set();
  const errors = [];

  for (const file of files) {
    const fullPath = path.join(projectsDir, file);
    const project = parseToml(await fs.readFile(fullPath, "utf8"));
    const repo = githubRepoFromUrl(project.sourceUrl ?? "");
    if (!repo) continue;

    catalogedRepos.add(repo);

    if (project.featurable === false) continue;

    const remote = await github(`/repos/${repo}`);
    const pushedAt = new Date(remote.pushed_at);
    const shouldBeActive = !remote.archived && pushedAt >= staleBefore;

    if (project.active !== shouldBeActive) {
      const reason = remote.archived
        ? "archived on GitHub"
        : `last updated ${remote.pushed_at}`;
      errors.push(
        `${file}: active should be ${shouldBeActive} (${repo} is ${reason})`,
      );
    }
  }

  const owners = [
    ...new Set(
      (process.env.PROJECT_CATALOG_OWNERS ?? "NotAShelf")
        .split(",")
        .map((owner) => owner.trim())
        .filter(Boolean),
    ),
  ];

  for (const owner of owners) {
    for (const repo of await listOwnerRepos(owner)) {
      const name = repo.full_name.toLowerCase();
      const stale = new Date(repo.pushed_at) < staleBefore;
      if (repo.fork || repo.archived || stale) continue;
      if (catalogedRepos.has(name) || exemptions.has(name)) continue;

      errors.push(
        `${repo.full_name}: active public repo is missing from project TOML; add it or exempt it in .github/project-catalog-exemptions.json`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
}

await main();
