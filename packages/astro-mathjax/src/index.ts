import remarkMath from "remark-math";
import rehypeMathjaxSvg from "rehype-mathjax/svg";
import type { AstroIntegration } from "astro";

export interface MathJaxSvgOptions {
  fontCache?: "local" | "global" | "none";
  scale?: number;
  minScale?: number;
}

export interface AstroMathJaxOptions {
  svg?: MathJaxSvgOptions;
  /**
   * Math applies to MDX automatically in Astro 5 (MDX inherits markdown plugins).
   * This option is kept for future compatibility but has no runtime effect.
   * @default true
   */
  includeMdx?: boolean;
}

export default function mathjax(
  options: AstroMathJaxOptions = {},
): AstroIntegration {
  const { svg = {} } = options;

  return {
    name: "astro-mathjax",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [[rehypeMathjaxSvg, svg]],
          },
        });
      },
    },
  };
}
