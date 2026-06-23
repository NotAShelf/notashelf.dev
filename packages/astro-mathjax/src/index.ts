import remarkMath from "remark-math";
import rehypeMathjaxSvg from "rehype-mathjax/svg";
import { unified, isUnifiedProcessor } from "@astrojs/markdown-remark";
import type { AstroIntegration } from "astro";

export interface MathJaxSvgOptions {
  fontCache?: "local" | "global" | "none";
  scale?: number;
  minScale?: number;
}

export interface AstroMathJaxOptions {
  svg?: MathJaxSvgOptions;
}

export default function mathjax(
  options: AstroMathJaxOptions = {},
): AstroIntegration {
  const { svg = {} } = options;

  return {
    name: "astro-mathjax",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        const existing = (config.markdown as any)?.processor;
        if (existing && isUnifiedProcessor(existing)) {
          const opts = existing.options;
          updateConfig({
            markdown: {
              processor: unified({
                ...opts,
                remarkPlugins: [...(opts.remarkPlugins ?? []), remarkMath],
                rehypePlugins: [
                  ...(opts.rehypePlugins ?? []),
                  [rehypeMathjaxSvg, svg],
                ],
              }),
            },
          });
        } else {
          updateConfig({
            markdown: {
              processor: unified({
                remarkPlugins: [remarkMath],
                rehypePlugins: [[rehypeMathjaxSvg, svg]],
              }),
            },
          });
        }
      },
    },
  };
}
