import type { AstroIntegration } from "astro";

/**
 * Interface defining the options for the Astro Email Obfuscation integration.
 */
interface AstroEmailObfuscationOptions {
  /**
   * Custom format for obfuscated emails. Use {user} and {domain} as placeholders.
   * @default "{user} @ {domain}"
   */
  format?: string;

  /**
   * Whether to obfuscate email addresses in href attributes
   * @default true
   */
  obfuscateHrefs?: boolean;

  /**
   * Whether to obfuscate email addresses in text content
   * @default true
   */
  obfuscateText?: boolean;

  /**
   * CSS selector for elements that should NOT be obfuscated
   * @default ".no-obfuscate"
   */
  excludeSelector?: string;

  /**
   * Maximum number of files to process concurrently
   * @default 5
   */
  concurrencyLimit?: number;
}

/**
 * Astro integration function to obfuscate email addresses in the HTML output.
 */
declare function astroEmailObfuscation(
  userOptions?: Partial<AstroEmailObfuscationOptions>,
): AstroIntegration;

export default astroEmailObfuscation;
export type { AstroEmailObfuscationOptions };
