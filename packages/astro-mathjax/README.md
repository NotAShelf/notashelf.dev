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

<!--markdownlint-disable MD013-->

```ts
mathjax({
  svg: {
    fontCache: "local", // "local" (default) | "none" | "global" (falls back to "local")
    scale: 1,
    minScale: 0.5,
  },
});
```

<!--markdownlint-enable MD013-->

`svg` configures MathJax's SVG output. For example, `fontCache: "none"` embeds
glyph paths directly in each SVG instead of using a local glyph cache.
`fontCache: "global"` falls back to `"local"`: standalone Markdown HTML does not
contain the document-wide glyph definitions needed by MathJax's global cache.

## License

[MPL-2.0](./LICENSE)
