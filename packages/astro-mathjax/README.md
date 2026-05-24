# astro-mathjax

MathJax math rendering for [Astro](https://astro.build) via
[`remark-math`](https://github.com/remarkjs/remark-math) and
[`rehype-mathjax`](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-mathjax).

Parses `$...$` (inline) and `$$...$$` (block) math syntax and renders it as
static SVG at build time with no client-side JavaScript required.

## Usage

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import mathjax from "astro-mathjax";

export default defineConfig({
  integrations: [mathjax()],
});
```

In any `.md` or `.mdx` file:

```md
Inline: $E = mc^2$

Block: $$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## Options

```ts
mathjax({
  svg: {
    fontCache: "local", // "local" (default) | "global" | "none"
    scale: 1,
    minScale: 0.5,
  },
});
```

## License

[MPL-2.0](./LICENSE)
