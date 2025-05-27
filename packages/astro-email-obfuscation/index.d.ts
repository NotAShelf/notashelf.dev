import type { AstroIntegration } from "astro";

/**
 * Interface defining the options for the Astro Email Obfuscation integration.
 */
interface AstroEmailObfuscationOptions {
  /**
   * The obfuscation method to use
   * @default "rot18"
   */
  method?: "rot18" | "reverse" | "base64" | "deconstruct";

  /**
   * Whether to process emails in development mode
   * @default false
   */
  dev?: boolean;

  /**
   * CSS selector for elements that should NOT be obfuscated
   * @default ".no-obfuscate"
   */
  excludeSelector?: string;

  /**
   * Custom placeholder text for clickable obfuscated emails
   * @default "[Click to reveal email]"
   */
  placeholder?: string;
}

/**
 * Astro integration function to obfuscate email addresses in the HTML output.
 */
declare function astroEmailObfuscation(
  userOptions?: AstroEmailObfuscationOptions,
): AstroIntegration;

export default astroEmailObfuscation;
export type { AstroEmailObfuscationOptions };
