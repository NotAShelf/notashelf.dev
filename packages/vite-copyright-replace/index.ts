import type { Plugin } from 'vite';

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
export function copyrightYearPlugin(options: CopyrightYearOptions = {}): Plugin {
  const {
    placeholder = '__COPYRIGHT_YEAR__',
    startYear = 2024
  } = options;

  const currentYear = new Date().getFullYear();
  const copyrightYear = currentYear === startYear ? startYear.toString() : `${startYear}-${currentYear}`;

  return {
    name: 'copyright-year',
    enforce: 'pre',
    transform(code: string, id: string) {
      // Only process relevant files (avoid processing node_modules and other irrelevant files)
      if (
        id.includes('node_modules') ||
        (!id.endsWith('.astro') && !id.endsWith('.ts') && !id.endsWith('.js') && !id.endsWith('.svelte'))
      ) {
        return null;
      }

      // Replace the placeholder with the copyright year
      if (code.includes(placeholder)) {
        console.log(`[copyright-year] Replacing ${placeholder} with ${copyrightYear} in ${id}`);
        const transformedCode = code.replace(
          new RegExp(placeholder, 'g'),
          copyrightYear
        );

        return {
          code: transformedCode,
          map: null
        };
      }

      return null;
    }
  };
}

export default copyrightYearPlugin;
