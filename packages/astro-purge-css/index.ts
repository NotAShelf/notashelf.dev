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

        const cssFiles = await glob("**/*.css", { cwd: distPath });

        if (cssFiles.length === 0) {
          logger.info("No CSS files found to purge");
          return;
        }

        logger.info(`Found ${cssFiles.length} CSS files to purge`);

        const htmlFiles = await glob("**/*.html", { cwd: distPath });
        const jsFiles = await glob("**/*.js", { cwd: distPath });

        const content: string[] = [];

        for (const htmlFile of htmlFiles) {
          const htmlContent = await readFile(
            path.join(distPath, htmlFile),
            "utf-8",
          );
          content.push(htmlContent);
        }

        for (const jsFile of jsFiles) {
          const jsContent = await readFile(
            path.join(distPath, jsFile),
            "utf-8",
          );
          content.push(jsContent);
        }

        const purgeCSS = new PurgeCSS();

        for (const cssFile of cssFiles) {
          const cssPath = path.join(distPath, cssFile);
          const cssContent = await readFile(cssPath, "utf-8");
          const originalSize = cssContent.length;

          const [result] = await purgeCSS.purge({
            content: content.map((c) => ({
              raw: c,
              extension: "html" as const,
            })),
            css: [{ raw: cssContent }],
            defaultExtractor: (content) => {
              const broadMatches =
                content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches =
                content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              return [...broadMatches, ...innerMatches];
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
            plugins.push(
              cssnano(
                typeof cssnanoOptions === "boolean" ? {} : cssnanoOptions,
              ),
            );
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
