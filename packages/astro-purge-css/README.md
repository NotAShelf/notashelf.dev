# astro-purge-css

An Astro integration that removes unused CSS using PurgeCSS during the build
process.

## Usage

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";
import purgeCss from "astro-purge-css";

export default defineConfig({
  integrations: [
    purgeCss({
      safelist: ["active"],
      keyframes: true,
    }),
  ],
});
```

## Options

[PurgeCSS options]: https://purgecss.com/configuration.html

Pass [PurgeCSS options] through `purgeCSS`. `content`, `css`, and
`defaultExtractor` are managed by the integration. Use `postcss.plugins` for
additional PostCSS plugins and `cssnano: false` to disable minification.

### Common Options

- `safelist`: Array of selectors that should never be removed
- `blocklist`: Array of selectors that should always be removed
- `keyframes`: Remove unused keyframes (default: false)
- `fontFace`: Remove unused font-face rules (default: false)

## How it works

The integration reads generated HTML and JavaScript after the build to determine
which CSS selectors are used, then processes generated CSS files with PurgeCSS,
optional PostCSS plugins, and cssnano (enabled by default). HTML and JavaScript
outputs are not modified. A CSS processing error fails the build rather than
leaving an unoptimized file unnoticed.

## Attributions

[vite-plugin-html-purgecss]: https://github.com/colecrouter/vite-plugin-html-purgecss

Work done here is based on [vite-plugin-html-purgecss], but redesigned with my
own needs in mind. The codebase has changed a lot, but you can see the spirit of
the obvious plugin still in tact. As such I owe the author a very big thank you.
