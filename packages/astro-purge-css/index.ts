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

/**
 * Normalizes FontAwesome dynamic IDs to stable identifiers for deterministic builds
 */
function normalizeFontAwesomeIds(content: string): string {
  const idMapping = new Map<string, string>();
  let idCounter = 0;

  const getStableId = (originalId: string): string => {
    if (!idMapping.has(originalId)) {
      idMapping.set(originalId, `svg-inline--fa-title-stable-${idCounter++}`);
    }
    return idMapping.get(originalId)!;
  };

  // First pass: collect all FontAwesome title IDs to build stable mapping
  const faIdPattern = /svg-inline--fa-title-[a-zA-Z0-9]+/g;
  let match;
  while ((match = faIdPattern.exec(content)) !== null) {
    getStableId(match[0]);
  }

  faIdPattern.lastIndex = 0;

  return content
    .replace(/svg-inline--fa-title-[a-zA-Z0-9]+/g, (match) =>
      getStableId(match),
    )
    .replace(
      /id="(svg-inline--fa-title-[a-zA-Z0-9]+)"/g,
      (match, originalId) => `id="${getStableId(originalId)}"`,
    )
    .replace(
      /aria-labelledby="(svg-inline--fa-title-[a-zA-Z0-9]+)"/g,
      (match, originalId) => `aria-labelledby="${getStableId(originalId)}"`,
    )
    .replace(
      /<title id="(svg-inline--fa-title-[a-zA-Z0-9]+)">/g,
      (match, originalId) => `<title id="${getStableId(originalId)}">`,
    );
}

/**
 * Normalizes data attributes to stable values
 */
function normalizeDataAttributes(content: string): string {
  return content.replace(/(data-fa-[a-z]+-id)="[a-zA-Z0-9]+"/g, '$1="stable"');
}

/**
 * Normalizes class attributes by sorting and deduplicating classes
 */
function normalizeClassAttributes(content: string): string {
  return content.replace(/class="([^"]*?)"/g, (match, classes) => {
    if (!classes || !classes.trim()) {
      return `class=""`;
    }
    const uniqueSortedClasses = [...new Set(classes.trim().split(/\s+/))]
      .sort()
      .join(" ");
    return `class="${uniqueSortedClasses}"`;
  });
}

/**
 * Normalizes content for PurgeCSS to ensure deterministic builds
 */
function normalizeContentForPurgeCSS(content: string): string {
  return normalizeClassAttributes(
    normalizeDataAttributes(normalizeFontAwesomeIds(content)),
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

        // Process CSS files in parallel with controlled concurrency
        const processCSSFile = async (cssFile: string) => {
          const cssPath = path.join(distPath, cssFile);
          const normalizedCssPath = path.resolve(cssPath);
          const normalizedDistPath = path.resolve(distPath);

          // Security: try to prevent path traversal attacks
          if (!normalizedCssPath.startsWith(normalizedDistPath)) {
            logger.warn(`Skipping file outside dist directory: ${cssFile}`);
            return { cssFile, error: "Path traversal attempt" };
          }

          try {
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

            return {
              cssFile,
              originalSize,
              newSize,
              reduction,
              success: true,
            };
          } catch (error) {
            logger.warn(`Failed to process ${cssFile}: ${error}`);
            return { cssFile, error: String(error), success: false };
          }
        };

        // Process CSS files with controlled concurrency (max 4 parallel)
        const concurrencyLimit = Math.min(4, cssFiles.length);
        const results: Array<{
          cssFile: string;
          originalSize?: number;
          newSize?: number;
          reduction?: string;
          success?: boolean;
          error?: string;
        }> = [];

        for (let i = 0; i < cssFiles.length; i += concurrencyLimit) {
          const batch = cssFiles.slice(i, i + concurrencyLimit);
          const batchResults = await Promise.all(batch.map(processCSSFile));
          results.push(...batchResults);
        }

        // Log results in original order
        const successfulResults = results.filter((r) => r.success);
        const failedResults = results.filter((r) => !r.success);

        for (const result of successfulResults) {
          if (result.originalSize && result.newSize && result.reduction) {
            logger.info(
              `${result.cssFile} - ${result.originalSize}b → ${result.newSize}b (${result.reduction}% reduction)`,
            );
          }
        }

        if (failedResults.length > 0) {
          logger.warn(`Failed to process ${failedResults.length} CSS files`);
        }

        logger.info("CSS purging completed");
      },
    },
  };
}

export default purgeCSSIntegration;
export { purgeCSSIntegration };
export type { PurgeCSSIntegrationOptions, CSSNanoOptions, PostCSSConfig };
