import { describe, it, expect } from "vitest";
import mathjax from "../../index.ts";
import remarkMath from "remark-math";
import rehypeMathjaxSvg from "rehype-mathjax/svg";
import { createMockSetupContext } from "./setup.ts";

describe("astro-mathjax integration", () => {
  it("has correct integration name", () => {
    const integration = mathjax();
    expect(integration.name).toBe("astro-mathjax");
  });

  it("calls updateConfig with remarkMath plugin", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    expect(ctx.updateConfig).toHaveBeenCalledOnce();
    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const plugins = calledWith.markdown.remarkPlugins;
    expect(plugins).toContain(remarkMath);
  });

  it("calls updateConfig with rehypeMathjaxSvg plugin", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const plugins = calledWith.markdown.rehypePlugins;
    expect(plugins[0][0]).toBe(rehypeMathjaxSvg);
  });

  it("passes empty svg options by default", async () => {
    const integration = mathjax();
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const [, svgOptions] = calledWith.markdown.rehypePlugins[0];
    expect(svgOptions).toEqual({});
  });

  it("forwards svg options to rehype-mathjax", async () => {
    const integration = mathjax({ svg: { fontCache: "global", scale: 1.2 } });
    const ctx = createMockSetupContext();
    await integration.hooks["astro:config:setup"]!(ctx);

    const [calledWith] = ctx.updateConfig.mock.calls[0];
    const [, svgOptions] = calledWith.markdown.rehypePlugins[0];
    expect(svgOptions).toEqual({ fontCache: "global", scale: 1.2 });
  });

  it("accepts includeMdx option without error", () => {
    expect(() => mathjax({ includeMdx: false })).not.toThrow();
    expect(() => mathjax({ includeMdx: true })).not.toThrow();
  });
});
