import { describe, it, expect } from "vitest";
import mathjax from "../../index.ts";
import remarkMath from "remark-math";
import rehypeMathjaxSvg from "rehype-mathjax/svg";
import { unified, isUnifiedProcessor } from "@astrojs/markdown-remark";
import { createMockSetupContext } from "./setup.ts";

describe("astro-mathjax integration", () => {
  it("has correct integration name", () => {
    const integration = mathjax();
    expect(integration.name).toBe("astro-mathjax");
  });

  it("calls updateConfig with a unified processor", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    expect(ctx.updateConfig).toHaveBeenCalledOnce();
    const [calledWith] = ctx.updateConfig.mock.calls[0];
    expect(isUnifiedProcessor(calledWith.markdown.processor)).toBe(true);
  });

  it("includes remarkMath in processor plugins", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const { remarkPlugins } = calledWith.markdown.processor.options;
    expect(remarkPlugins).toContain(remarkMath);
  });

  it("includes rehypeMathjaxSvg in processor plugins", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const { rehypePlugins } = calledWith.markdown.processor.options;
    expect(rehypePlugins[0][0]).toBe(rehypeMathjaxSvg);
  });

  it("passes empty svg options by default", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const [, svgOptions] =
      calledWith.markdown.processor.options.rehypePlugins[0];
    expect(svgOptions).toEqual({});
  });

  it("forwards svg options to rehype-mathjax", async () => {
    const integration = mathjax({ svg: { fontCache: "global", scale: 1.2 } });
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const [, svgOptions] =
      calledWith.markdown.processor.options.rehypePlugins[0];
    expect(svgOptions).toEqual({ fontCache: "global", scale: 1.2 });
  });

  it("extends an existing unified processor", async () => {
    const existingProcessor = unified({ remarkPlugins: [], rehypePlugins: [] });
    const integration = mathjax();
    const ctx = createMockSetupContext(existingProcessor);
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const { remarkPlugins } = calledWith.markdown.processor.options;
    expect(remarkPlugins).toContain(remarkMath);
  });
});
