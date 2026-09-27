import type { AstroIntegration } from "astro";
import cssnano from "cssnano";
import type { Options as CSSNanoOptions } from "cssnano";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import postcss from "postcss";
import type { AcceptedPlugin, ProcessOptions } from "postcss";
import { PurgeCSS } from "purgecss";
import type { UserDefinedOptions } from "purgecss";

interface PostCSSConfig {
  plugins?: AcceptedPlugin[];
  options?: ProcessOptions;
}

interface PurgeCSSIntegrationOptions {
  purgeCSS?: Partial<UserDefinedOptions>;
  cssnano?: boolean | CSSNanoOptions;
  postcss?: PostCSSConfig;
  safelist?: string[];
  blocklist?: string[];
  keyframes?: boolean;
  fontFace?: boolean;
}

const extractSelectors = (content: string): string[] => {
  const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
  const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
  return [...new Set([...broadMatches, ...innerMatches])].sort();
};

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
  } = options;

  const finalPurgeOptions = {
    ...purgeOptions,
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
        const files = (
          await glob("**/*.{css,html,js}", { cwd: distPath })
        ).sort();
        const cssFiles = files.filter((file) => file.endsWith(".css"));

        if (cssFiles.length === 0) {
          logger.info("No CSS files found to purge");
          return;
        }

        logger.info(`Found ${cssFiles.length} CSS files to purge`);

        const content = await Promise.all(
          files
            .filter((file) => file.endsWith(".html") || file.endsWith(".js"))
            .map(async (file) => ({
              raw: await readFile(path.join(distPath, file), "utf8"),
              extension: path.extname(file).slice(1),
            })),
        );

        const plugins: AcceptedPlugin[] = [...(postcssConfig?.plugins ?? [])];
        if (cssnanoOptions !== false) {
          const config =
            typeof cssnanoOptions === "object" ? cssnanoOptions : {};
          plugins.push(
            cssnano({
              ...config,
              preset: config.preset ?? [
                "default",
                {
                  discardComments: { removeAll: true },
                  discardOverridden: false,
                  reduceIdents: false,
                  zindex: false,
                },
              ],
            }),
          );
        }
        const processor = plugins.length > 0 ? postcss(plugins) : undefined;

        const processCSSFile = async (cssFile: string) => {
          const cssPath = path.join(distPath, cssFile);
          try {
            const originalCSS = await readFile(cssPath, "utf8");
            const [result] = await new PurgeCSS().purge({
              ...finalPurgeOptions,
              content,
              css: [{ raw: originalCSS }],
              defaultExtractor: extractSelectors,
            });

            const finalCSS = processor
              ? (
                  await processor.process(result.css, {
                    from: undefined,
                    ...postcssConfig?.options,
                  })
                ).css
              : result.css;
            await writeFile(cssPath, finalCSS);

            const reduction = originalCSS.length
              ? (
                  ((originalCSS.length - finalCSS.length) /
                    originalCSS.length) *
                  100
                ).toFixed(1)
              : "0.0";
            return `${cssFile} - ${originalCSS.length}b → ${finalCSS.length}b (${reduction}% reduction)`;
          } catch (error) {
            throw new Error(`Failed to process ${cssFile}`, { cause: error });
          }
        };

        for (let i = 0; i < cssFiles.length; i += 4) {
          const results = await Promise.all(
            cssFiles.slice(i, i + 4).map(processCSSFile),
          );
          for (const result of results) logger.info(result);
        }

        logger.info("CSS purging completed");
      },
    },
  };
}

export default purgeCSSIntegration;
export { purgeCSSIntegration };
export type { PurgeCSSIntegrationOptions, CSSNanoOptions, PostCSSConfig };
