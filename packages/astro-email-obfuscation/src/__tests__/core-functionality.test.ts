import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import astroEmailObfuscation from "../../index.js";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
  vi.useRealTimers();
});

async function build(
  html: string,
  options: Parameters<typeof astroEmailObfuscation>[0] = {},
  filename = "index.html",
) {
  const dir = await mkdtemp(path.join(tmpdir(), "astro-email-obfuscation-"));
  directories.push(dir);
  const file = path.join(dir, filename);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  const integration = astroEmailObfuscation({ ...options, dev: true });
  // Astro supplies additional hook fields unused by this integration.
  const context = {
    dir: pathToFileURL(dir + path.sep),
    logger: { info() {}, warn() {}, error() {}, debug() {} },
  } as unknown as Parameters<
    NonNullable<(typeof integration.hooks)["astro:build:done"]>
  >[0];
  await integration.hooks["astro:build:done"]!(context);
  return readFile(file, "utf8");
}

function rendered(html: string) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.com",
  });
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  return dom;
}

describe("built email pages", () => {
  it("obfuscates eligible siblings even when another element is excluded or already obfuscated", async () => {
    const html = `<body><div class="no-obfuscate"><a href="mailto:leave@example.com">Leave</a> leave@example.com</div><p>first@example.com</p><span class="rot18-email" data-email="byq@rknzcyr.pbz">old@example.com</span><p>second@example.com</p><script>const email = "script@example.com"</script></body>`;
    const result = await build(html);
    const dom = rendered(result);
    const document = dom.window.document;
    expect(document.querySelector(".no-obfuscate")?.textContent).toContain(
      "leave@example.com",
    );
    expect(
      document.querySelector(".no-obfuscate a")?.getAttribute("href"),
    ).toBe("mailto:leave@example.com");
    expect(
      document.querySelector('span.rot18-email[data-email="byq@rknzcyr.pbz"]')
        ?.textContent,
    ).toBe("old@example.com");
    expect(document.querySelectorAll("p .rot18-email")).toHaveLength(2);
    expect(document.querySelector("script")?.textContent).toContain(
      '"script@example.com"',
    );
    dom.window.close();
  });

  it("keeps link and text targeting independent and makes mailto replacements actionable", async () => {
    const html = `<body><a class="contact" href="mailto:link@example.com"><strong>Email us</strong></a><p>text@example.com</p></body>`;
    const links = await build(html, { target: "link" });
    const dom = rendered(links);
    const document = dom.window.document;
    expect(document.querySelector("p")?.textContent).toBe("text@example.com");
    const reveal = document.querySelector(".rot18-email") as HTMLElement;
    expect(reveal?.closest("a")).toBeNull();
    vi.useFakeTimers();
    reveal.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    vi.advanceTimersByTime(170);
    const link = reveal.querySelector("a");
    expect(link?.getAttribute("href")).toBe("mailto:link@example.com");
    expect(reveal.hasAttribute("tabindex")).toBe(false);
    const enter = new dom.window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    link?.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    dom.window.close();
    vi.useRealTimers();

    const text = await build(html, { target: "text" });
    const textDom = rendered(text);
    expect(
      textDom.window.document.querySelector("a.contact")?.getAttribute("href"),
    ).toBe("mailto:link@example.com");
    expect(
      textDom.window.document.querySelector("p .rot18-email"),
    ).not.toBeNull();
    textDom.window.close();
  });

  it.each([
    "js-concat",
    "js-interaction",
    "css-hidden",
    "reverse",
    "base64",
    "deconstruct",
  ] as const)("reveals a functioning mailto link with %s", async (method) => {
    const result = await build(`<body><p>hello@example.com</p></body>`, {
      methods: [method],
    });
    const dom = rendered(result);
    const element = dom.window.document.querySelector(
      "p > span",
    ) as HTMLElement;
    expect(element).not.toBeNull();
    vi.useFakeTimers();
    element.click();
    if (method === "js-interaction") {
      expect(element.querySelector("a")).toBeNull();
      element.click();
    }
    vi.advanceTimersByTime(method === "css-hidden" ? 520 : 170);
    expect(element.querySelector("a")?.getAttribute("href")).toBe(
      "mailto:hello@example.com",
    );
    dom.window.close();
  });

  it("keeps reverse emails usable when fallbacks are disabled", async () => {
    const result = await build(`<body><p>hello@example.com</p></body>`, {
      methods: ["reverse"],
      includeFallbacks: false,
    });
    const dom = rendered(result);
    const element = dom.window.document.querySelector(
      ".reverse-email-data",
    ) as HTMLElement;
    expect(element.textContent).toBe("[Click to reveal email]");
    expect(dom.window.getComputedStyle(element).display).not.toBe("none");
    vi.useFakeTimers();
    element.click();
    vi.advanceTimersByTime(170);
    expect(element.querySelector("a")?.getAttribute("href")).toBe(
      "mailto:hello@example.com",
    );
    dom.window.close();
  });

  it("renders a complete readable SVG address", async () => {
    const result = await build(`<body><p>hello@example.com</p></body>`, {
      methods: ["svg"],
    });
    const dom = rendered(result);
    const svg = dom.window.document.querySelector("p svg");
    expect(svg?.getAttribute("aria-label")).toBe(
      "Email address: hello@example.com",
    );
    expect(
      Array.from(
        svg?.querySelectorAll("text") || [],
        (letter) => letter.textContent,
      ).join(""),
    ).toBe("hello@example.com");
    dom.window.close();
  });

  it("generates a redirect without exposing the address in HTML", async () => {
    const result = await build(`<body><p>hello@example.com</p></body>`, {
      methods: ["http-redirect"],
      redirectBaseUrl: "/api/email",
    });
    const dom = rendered(result);
    const link = dom.window.document.querySelector(".http-redirect-email");
    expect(link?.getAttribute("href")).toBe(
      `/api/email?e=${encodeURIComponent(Buffer.from("hello@example.com").toString("base64"))}`,
    );
    expect(result).not.toContain("hello@example.com");
    dom.window.close();
  });

  it("uses the selected last method without requiring options for unused methods", async () => {
    const result = await build(`<body><p>hello@example.com</p></body>`, {
      methods: ["http-redirect", "rot18"],
    });
    const dom = rendered(result);
    expect(dom.window.document.querySelector(".rot18-email")).not.toBeNull();
    expect(
      dom.window.document.querySelector(".http-redirect-email"),
    ).toBeNull();
    dom.window.close();
  });

  it("leaves excluded paths and non-email hosts untouched while processing other pages", async () => {
    const html = `<body><p>root@host.local and valid@example.com</p></body>`;
    const excluded = await build(
      html,
      { excludePathPattern: /skip\.html$/ },
      "skip.html",
    );
    expect(excluded).toBe(html);
    const included = await build(html, { excludePathPattern: /skip\.html$/ });
    expect(included).toContain("root@host.local");
    expect(included).not.toContain("valid@example.com");
  });
});
