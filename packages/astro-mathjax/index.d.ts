import type { AstroIntegration } from "astro";

export interface MathJaxSvgOptions {
  fontCache?: "local" | "global" | "none";
  scale?: number;
  minScale?: number;
}

export interface AstroMathJaxOptions {
  svg?: MathJaxSvgOptions;
  includeMdx?: boolean;
}

export default function mathjax(
  options?: AstroMathJaxOptions,
): AstroIntegration;
