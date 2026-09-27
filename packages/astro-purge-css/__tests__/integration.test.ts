import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, expect, it, vi } from "vitest";
import purgeCss from "../index";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

it("purges unused CSS using HTML and client-side JavaScript without changing the HTML", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "astro-purge-css-"));
  directories.push(dir);
  const html =
    '<div class="from-html  from-html blocked" data-fa-title-id="ab12"></div>';
  await writeFile(path.join(dir, "index.html"), html);
  await writeFile(
    path.join(dir, "client.js"),
    'element.classList.add("from-js");',
  );
  await writeFile(
    path.join(dir, "site.css"),
    ".from-html { color: red } .from-js { color: blue } .unused { color: green } .blocked { color: black }",
  );

  const hook = purgeCss({ cssnano: false, blocklist: ["blocked"] }).hooks?.[
    "astro:build:done"
  ];
  if (!hook) throw new Error("Missing build hook");
  await hook({
    dir: pathToFileURL(`${dir}/`),
    logger: { info: vi.fn(), warn: vi.fn() },
  } as never);

  const css = await readFile(path.join(dir, "site.css"), "utf8");
  expect(css).toMatch(/\.from-html\s*\{/);
  expect(css).toMatch(/\.from-js\s*\{/);
  expect(css).not.toMatch(/\.(?:unused|blocked)\s*\{/);
  expect(await readFile(path.join(dir, "index.html"), "utf8")).toBe(html);
});

it("fails the build when a generated stylesheet cannot be purged", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "astro-purge-css-"));
  directories.push(dir);
  await writeFile(path.join(dir, "invalid.css"), ".broken {");

  const hook = purgeCss().hooks?.["astro:build:done"];
  if (!hook) throw new Error("Missing build hook");
  await expect(
    hook({
      dir: pathToFileURL(`${dir}/`),
      logger: { info: vi.fn(), warn: vi.fn() },
    } as never),
  ).rejects.toThrow("Failed to process invalid.css");
});
