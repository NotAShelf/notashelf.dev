import { PurgeCSS } from "purgecss";
import type { AstroIntegration } from "astro";
import { fileURLToPath } from "url";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import path from "path";
import cssnano from "cssnano";
import postcss from "postcss";
import type { ProcessOptions, Plugin, PluginCreator } from "postcss";

interface CSSNanoOptions {
  preset?: [string, Record<string, any>] | string;
  plugins?: any[];
  [key: string]: any;
}

interface PostCSSConfig {
  plugins?: (
    | Plugin
    | PluginCreator<any>
    | [Plugin | PluginCreator<any>, any]
    | string
    | [string, any]
  )[];
  options?: ProcessOptions;
}

interface PurgeCSSIntegrationOptions {
  purgeCSS?: Partial<import("purgecss").UserDefinedOptions>;
  cssnano?: boolean | CSSNanoOptions;
  postcss?: PostCSSConfig;
  safelist?: string[];
  blocklist?: string[];
  keyframes?: boolean;
  fontFace?: boolean;
}

function normalizePlugin(plugin: any): Plugin | PluginCreator<any> {
  if (Array.isArray(plugin)) {
    const [pluginFn, options] = plugin;
    return typeof pluginFn === "function" ? pluginFn(options) : pluginFn;
  }
  return typeof plugin === "function" ? plugin() : plugin;
}

function normalizeContentForPurgeCSS(content: string): string {
  // Create a mapping from original IDs to stable unique IDs
  const idMapping = new Map<string, string>();
  let idCounter = 0;

  // Gets or creates a stable ID for an original ID
  const getStableId = (originalId: string): string => {
    if (!idMapping.has(originalId)) {
      idMapping.set(originalId, `svg-inline--fa-title-stable-${idCounter++}`);
    }
    return idMapping.get(originalId)!;
  };

  // First pass: collect all FontAwesome title IDs to build the mapping
  const faIdPattern = /svg-inline--fa-title-[a-zA-Z0-9]+/g;
  let match;
  while ((match = faIdPattern.exec(content)) !== null) {
    getStableId(match[0]);
  }

  // Reset regex lastIndex for subsequent replacements
  faIdPattern.lastIndex = 0;

  return (
    content
      // Normalize all FontAwesome title ID references
      .replace(/svg-inline--fa-title-[a-zA-Z0-9]+/g, (match) =>
        getStableId(match),
      )
      // Normalize id attributes
      .replace(
        /id="(svg-inline--fa-title-[a-zA-Z0-9]+)"/g,
        (match, originalId) => `id="${getStableId(originalId)}"`,
      )
      // Normalize aria-labelledby attributes
      .replace(
        /aria-labelledby="(svg-inline--fa-title-[a-zA-Z0-9]+)"/g,
        (match, originalId) => `aria-labelledby="${getStableId(originalId)}"`,
      )
      // Normalize any other dynamic IDs that might appear in title tags
      .replace(
        /<title id="(svg-inline--fa-title-[a-zA-Z0-9]+)">/g,
        (match, originalId) => `<title id="${getStableId(originalId)}">`,
      )
      // Normalize potential other random identifiers (preserve attribute name, normalize value)
      .replace(/(data-fa-[a-z]+-id)="[a-zA-Z0-9]+"/g, '$1="stable"')
      // Sort any space-separated attribute values for consistency and remove duplicates
      .replace(/class="([^"]*?)"/g, (match, classes) => {
        if (!classes || !classes.trim()) {
          return `class=""`;
        }
        const uniqueSortedClasses = [...new Set(classes.trim().split(/\s+/))]
          .sort()
          .join(" ");
        return `class="${uniqueSortedClasses}"`;
      })
  );
}

function purgeCSSIntegration(
  options: PurgeCSSIntegrationOptions = {},
): AstroIntegration {
  const {
    cssnano: cssnanoOptions,
    postcss: postcssConfig,
    purgeCSS: purgeOptions = {},
    safelist,
    blocklist,
    keyframes,
    fontFace,
    ...restOptions
  } = options;

  const finalPurgeOptions = {
    ...purgeOptions,
    ...restOptions,
    ...(safelist && { safelist }),
    ...(blocklist && { blocklist }),
    ...(keyframes !== undefined && { keyframes }),
    ...(fontFace !== undefined && { fontFace }),
  };

  return {
    name: "astro-purgecss",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const distPath = fileURLToPath(dir);

        const cssFiles = (await glob("**/*.css", { cwd: distPath })).sort();

        if (cssFiles.length === 0) {
          logger.info("No CSS files found to purge");
          return;
        }

        logger.info(`Found ${cssFiles.length} CSS files to purge`);

        const htmlFiles = (await glob("**/*.html", { cwd: distPath })).sort();
        const jsFiles = (await glob("**/*.js", { cwd: distPath })).sort();

        const content: string[] = [];

        // Process HTML files in sorted order and normalize them
        for (const htmlFile of htmlFiles) {
          const htmlPath = path.join(distPath, htmlFile);
          const htmlContent = await readFile(htmlPath, "utf-8");
          const normalizedHtmlContent =
            normalizeContentForPurgeCSS(htmlContent);

          // Write back the normalized HTML to ensure deterministic output
          await writeFile(htmlPath, normalizedHtmlContent);

          content.push(normalizedHtmlContent);
        }

        // Process JS files in sorted order
        for (const jsFile of jsFiles) {
          const jsContent = await readFile(
            path.join(distPath, jsFile),
            "utf-8",
          );
          content.push(jsContent);
        }

        // Content is already normalized from the HTML processing above
        const normalizedContent = content;

        const purgeCSS = new PurgeCSS();

        for (const cssFile of cssFiles) {
          const cssPath = path.join(distPath, cssFile);
          const cssContent = await readFile(cssPath, "utf-8");
          const originalSize = cssContent.length;

          const [result] = await purgeCSS.purge({
            content: normalizedContent.map((c) => ({
              raw: c,
              extension: "html" as const,
            })),
            css: [{ raw: cssContent }],
            defaultExtractor: (content) => {
              const broadMatches =
                content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches =
                content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              // Sort matches to ensure deterministic output
              return [...new Set([...broadMatches, ...innerMatches])].sort();
            },
            ...finalPurgeOptions,
          });

          let finalCSS = result.css;

          const plugins: any[] = [];

          if (postcssConfig?.plugins) {
            for (const plugin of postcssConfig.plugins) {
              plugins.push(normalizePlugin(plugin));
            }
          }

          if (cssnanoOptions !== false) {
            const cssnanoConfig =
              typeof cssnanoOptions === "boolean" ? {} : cssnanoOptions || {};
            const deterministicConfig = {
              ...cssnanoConfig,
              preset: cssnanoConfig.preset || [
                "default",
                {
                  mergeRules: true,
                  mergeLonghand: true,
                  normalizeWhitespace: true,
                  discardComments: { removeAll: true },
                  minifySelectors: true,
                  discardDuplicates: true,
                  discardEmpty: true,
                  discardOverridden: false,
                  reduceIdents: false,
                  zindex: false,
                },
              ],
            };
            plugins.push(cssnano(deterministicConfig));
          }

          if (plugins.length > 0) {
            const postcssResult = await postcss(plugins).process(finalCSS, {
              from: undefined,
              ...postcssConfig?.options,
            });
            finalCSS = postcssResult.css;
          }

          await writeFile(cssPath, finalCSS);

          const newSize = finalCSS.length;
          const reduction = (
            ((originalSize - newSize) / originalSize) *
            100
          ).toFixed(1);

          logger.info(
            `${cssFile} - ${originalSize}b → ${newSize}b (${reduction}% reduction)`,
          );
        }

        logger.info("CSS purging completed");
      },
    },
  };
}

export default purgeCSSIntegration;
export { purgeCSSIntegration };
export type { PurgeCSSIntegrationOptions, CSSNanoOptions, PostCSSConfig };
