import { describe, it, expect, vi } from "vitest";
import {
  unified,
  type MarkdownProcessor,
  type UnifiedResolvedOptions,
} from "@astrojs/markdown-remark";
import type { AstroIntegration } from "astro";
import mathjax, { type AstroMathJaxOptions } from "../../index.ts";

async function renderMath(
  markdown: string,
  options?: AstroMathJaxOptions,
  processor?: MarkdownProcessor<UnifiedResolvedOptions>,
) {
  const updateConfig =
    vi.fn<
      (change: {
        markdown: { processor: MarkdownProcessor<UnifiedResolvedOptions> };
      }) => void
    >();
  const ctx = {
    config: { markdown: processor ? { processor } : {} },
    updateConfig,
  } as unknown as Parameters<
    NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
  >[0];
  await mathjax(options).hooks["astro:config:setup"]!(ctx);
  const configured = updateConfig.mock.calls[0][0].markdown.processor;
  const renderer = await configured.createRenderer({ syntaxHighlight: false });
  return (await renderer.render(markdown)).code;
}

describe("astro-mathjax integration", () => {
  it("renders inline and display math as SVG without altering surrounding prose", async () => {
    const html = await renderMath("Before $x^2$ after.\n\n$$\ny^2\n$$");

    expect(html).toMatch(
      /<p>Before <mjx-container class="MathJax" jax="SVG"><svg\b[\s\S]*?<\/svg><\/mjx-container> after\.<\/p>/,
    );
    expect(html).toMatch(
      /<mjx-container class="MathJax" jax="SVG" display="true"><svg\b[\s\S]*?<\/svg><\/mjx-container>/,
    );
    expect(html).not.toContain("$x^2$");
  });

  it("honors SVG output configuration without losing glyphs", async () => {
    const local = await renderMath("$x$", { svg: { fontCache: "local" } });
    const uncached = await renderMath("$x$", { svg: { fontCache: "none" } });
    const global = await renderMath("$x$", { svg: { fontCache: "global" } });

    expect(local).toContain("<defs>");
    expect(local).toContain("<use ");
    expect(uncached).not.toContain("<defs>");
    expect(uncached).not.toContain("<use ");
    expect(uncached).toContain("<path ");
    expect(global).toMatch(
      /<defs><path id="([^"]+)"[\s\S]*?<\/defs>[\s\S]*?<use [^>]*xlink:href="#\1"/,
    );
  });

  it("retains existing processor settings and plugins while rendering math", async () => {
    const existing = unified({
      gfm: false,
      rehypePlugins: [
        () => (tree) => {
          const paragraph = tree.children.find(
            (node) => node.type === "element" && node.tagName === "p",
          );
          if (paragraph?.type === "element") {
            paragraph.properties["data-existing"] = "retained";
          }
        },
      ],
    });

    const html = await renderMath("~~literal~~ and $x$", undefined, existing);

    expect(html).toMatch(
      /<p data-existing="retained">~~literal~~ and <mjx-container class="MathJax" jax="SVG"><svg\b/,
    );
    expect(html).not.toContain("<del>");
  });
});
