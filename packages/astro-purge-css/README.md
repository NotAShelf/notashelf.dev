# astro-purge-css

An Astro integration that removes unused CSS using PurgeCSS during the build
process.

## Usage

```typescript
# In your Astro config
import { defineConfig } from "astro/config";
import purgeCss from "astro-purge-css";

export default defineConfig({
  integrations: [
    purgeCss({
      safelist: ["safe-class"],
      blocklist: ["blocked-class"],
    }),
  ],
});
```

## Options

[PurgeCSS options]: https://purgecss.com/configuration.html

This plugin accepts all [PurgeCSS options]. The `content` and `css` options are
automatically handled by the plugin.

### Common Options

- `safelist`: Array of selectors that should never be removed
- `blocklist`: Array of selectors that should always be removed
- `keyframes`: Remove unused keyframes (default: false)
- `fontFace`: Remove unused font-face rules (default: false)

## How it works

The integration analyzes your HTML and JavaScript files after the build is
complete to determine which CSS selectors are actually used, then removes unused
CSS from all generated CSS files.

## Attributions

[vite-plugin-html-purgecss]: https://github.com/colecrouter/vite-plugin-html-purgecss

Work done here is based on [vite-plugin-html-purgecss], but redesigned with my
own needs in mind. The codebase has changed a lot, but you can see the spirit of
the obvious plugin still in tact. As such I owe the author a very big thank you.
