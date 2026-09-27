import type { Plugin } from "vite";

interface CopyrightYearOptions {
  /**
   * The variable name to replace (default: '__COPYRIGHT_YEAR__')
   */
  placeholder?: string;

  /**
   * Starting year for the copyright (default: 2024)
   */
  startYear?: number;
}

/**
 * Vite plugin that replaces copyright year placeholders during build time
 * instead of calculating them on the client side.
 */
export function copyrightYearPlugin(
  options: CopyrightYearOptions = {},
): Plugin {
  const { placeholder = "__COPYRIGHT_YEAR__", startYear = 2024 } = options;

  const currentYear = new Date().getFullYear();
  const copyrightYear =
    currentYear === startYear
      ? startYear.toString()
      : `${startYear}-${currentYear}`;
  let isProduction = false;

  // Pre-compile extension set for efficient lookups
  const validExtensions = new Set([".astro", ".ts", ".js", ".svelte"]);

  return {
    name: "copyright-year",
    enforce: "pre",
    configResolved(config) {
      isProduction = config.command === "build";
    },
    transform(code: string, id: string) {
      // Vite appends queries to module IDs (for example, .astro?astro&type=template).
      const queryIndex = id.indexOf("?");
      const fileId = queryIndex === -1 ? id : id.slice(0, queryIndex);
      if (/(?:^|[/\\])node_modules[/\\]/.test(fileId)) {
        return null;
      }

      if (!validExtensions.has(fileId.slice(fileId.lastIndexOf(".")))) {
        return null;
      }

      // Replace the placeholder with the copyright year
      if (code.includes(placeholder)) {
        if (isProduction) {
          const fileName = id.split("/").pop() || id;
          this.info(
            `Replacing ${placeholder} with ${copyrightYear} in ${fileName}`,
          );
        }
        const transformedCode = code.replaceAll(placeholder, copyrightYear);

        return {
          code: transformedCode,
          map: null,
        };
      }

      return null;
    },
  };
}

export default copyrightYearPlugin;
