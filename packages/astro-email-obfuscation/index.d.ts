import type { AstroIntegration } from "astro";

/**
 * Available obfuscation methods with their effectiveness and characteristics.
 *
 * Highly Effective (JavaScript-based):
 * - "rot18": ROT13+ROT5 encoding with click-to-reveal (maintains high bot resistance)
 * - "js-concat": Dynamic email assembly using JavaScript string concatenation
 * - "js-interaction": Email revealed only after user interaction (click/hover)
 * - "svg": Email rendered inside inline SVG element (invisible to most crawlers)
 * - "css-hidden": Uses display:none with CSS/JS reassembly
 * - "http-redirect": Server-side redirect to reconstruct email (requires backend)
 *
 * Moderately Effective (Static but combinable):
 * - "reverse": Simple string reversal (less effective alone, better when combined)
 * - "base64": Base64 encoding (less effective alone, better when combined)
 * - "deconstruct": Character array reconstruction (less effective alone)
 */
type ObfuscationMethod =
  | "rot18"
  | "js-concat"
  | "js-interaction"
  | "svg"
  | "css-hidden"
  | "http-redirect"
  | "reverse"
  | "base64"
  | "deconstruct";

/**
 * Target types for email processing
 */
type ProcessingTarget = "text" | "link" | "both";

/**
 * Interface defining the options for the Astro Email Obfuscation integration.
 */
interface AstroEmailObfuscationOptions {
  /**
   * Array of obfuscation methods to apply in sequence for layered defense.
   * Methods are applied in the order specified, allowing for method chaining.
   * @default ["rot18"]
   */
  methods?: ObfuscationMethod[];

  /**
   * Legacy single method support (deprecated, use methods array instead)
   * @deprecated Use methods array for better security
   */
  method?: ObfuscationMethod;

  /**
   * Control which parts of HTML to process
   * - "text": Only process standalone email text
   * - "link": Only process mailto: links
   * - "both": Process both text and links
   * @default "both"
   */
  target?: ProcessingTarget;

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

  /**
   * Server redirect base URL for http-redirect method
   * Required when using "http-redirect" method
   * @example "/api/email-redirect"
   */
  redirectBaseUrl?: string;

  /**
   * Whether to include non-JavaScript fallbacks where possible
   * Improves accessibility but may reduce obfuscation effectiveness
   * @default true
   */
  includeFallbacks?: boolean;
}

/**
 * Astro integration function to obfuscate email addresses in the HTML output.
 */
declare function astroEmailObfuscation(
  userOptions?: AstroEmailObfuscationOptions,
): AstroIntegration;

export default astroEmailObfuscation;
export type { AstroEmailObfuscationOptions };
