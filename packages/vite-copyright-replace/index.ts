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
      // Only process relevant files (avoid processing node_modules and other irrelevant files)
      if (id.includes("node_modules")) {
        return null;
      }

      // Efficient extension checking using Set lookup
      const hasValidExtension = validExtensions.has(
        id.slice(id.lastIndexOf(".")),
      );
      if (!hasValidExtension) {
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
        // Escape special regex characters in the placeholder to treat it as a literal string
        const escapedPlaceholder = placeholder.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const transformedCode = code.replace(
          new RegExp(escapedPlaceholder, "g"),
          copyrightYear,
        );

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
