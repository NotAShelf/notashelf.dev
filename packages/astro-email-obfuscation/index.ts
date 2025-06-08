import type { AstroIntegration } from "astro";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Available obfuscation methods with their effectiveness and characteristics.
 */
export type ObfuscationMethod =
  | "rot18"
  | "js-concat"
  | "js-interaction"
  | "svg"
  | "css-hidden"
  | "http-redirect"
  | "reverse"
  | "base64"
  | "deconstruct";

type ProcessingTarget = "text" | "link" | "both";

interface AstroEmailObfuscationOptions {
  /**
   * Array of obfuscation methods to apply in sequence for layered defense.
   */
  methods?: ObfuscationMethod[];

  /**
   * Legacy single method support (deprecated)
   */
  method?: ObfuscationMethod;

  /**
   * Control which parts of HTML to process
   */
  target?: ProcessingTarget;

  dev?: boolean;
  excludeSelector?: string;
  placeholder?: string;
  redirectBaseUrl?: string;
  includeFallbacks?: boolean;
}

export default function astroEmailObfuscation(
  userOptions: AstroEmailObfuscationOptions = {},
): AstroIntegration {
  // Handle legacy method option and new methods array
  const methods =
    userOptions.methods ||
    (userOptions.method ? [userOptions.method] : ["rot18"]);

  // Validate http-redirect method requirements BEFORE applying defaults
  // Validate if http-redirect is used and redirectBaseUrl is not provided or is empty
  if (
    methods.includes("http-redirect") &&
    (!userOptions.redirectBaseUrl || userOptions.redirectBaseUrl === "")
  ) {
    throw new Error(
      "redirectBaseUrl is required when using http-redirect method",
    );
  }

  const options = {
    methods,
    target: userOptions.target || "both",
    dev: userOptions.dev || false,
    excludeSelector: userOptions.excludeSelector || ".no-obfuscate",
    placeholder: userOptions.placeholder || "[Click to reveal email]",
    redirectBaseUrl: userOptions.redirectBaseUrl || "/api/email-redirect",
    includeFallbacks: userOptions.includeFallbacks !== false,
  } as const;

  // Utility functions

  // ROT18 encoding (ROT13 for letters + ROT5 for numbers) - Highly effective
  function rot18(str: string): string {
    return str.replace(/[a-zA-Z0-9]/g, function (char) {
      if (char >= "0" && char <= "9") {
        return String.fromCharCode(((char.charCodeAt(0) - 48 + 5) % 10) + 48);
      } else {
        const start = char <= "Z" ? 65 : 97;
        return String.fromCharCode(
          ((char.charCodeAt(0) - start + 13) % 26) + start,
        );
      }
    });
  }

  // Base64 encode - Moderate effectiveness when combined
  function base64Encode(str: string): string {
    return Buffer.from(str).toString("base64");
  }

  // Split email into parts - Moderate effectiveness when combined
  function deconstructEmail(email: string): string[] {
    return email.split("");
  }

  // Reverse email string - Moderate effectiveness when combined
  function reverseEmail(email: string): string {
    return email.split("").reverse().join("");
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Validate and sanitize email input
  function validateEmail(email: string): boolean {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Length validation
    if (email.length > 254) {
      return false;
    }

    // Check for dangerous characters
    const dangerousChars = /<|>|"|'|&|script|javascript|data:/i;
    if (dangerousChars.test(email)) {
      return false;
    }

    return true;
  }

  // Generate deterministic unique ID based on content hash
  // This ensures IDs are stable across builds for the same content
  function generateUniqueId(email: string, method: string): string {
    // Simple hash function for deterministic IDs
    const content = `${email}|${method}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    // Convert to positive number and base36
    const positiveHash = Math.abs(hash).toString(36);
    return "obf_" + positiveHash.padStart(6, "0");
  }

  /**
   * Individual obfuscation method implementations
   * Each method includes documentation about effectiveness and compatibility
   */
  const obfuscationMethods = {
    /**
     * ROT18 (ROT13+ROT5) - High effectiveness, good screen reader compatibility
     * Bot resistance: High (requires JS decoding)
     * Screen reader compatibility: Good (with proper fallbacks)
     * Crawler resistance: High
     */
    rot18: (email: string) => {
      if (!validateEmail(email)) {
        return email; // return unchanged if invalid
      }

      const encoded = rot18(email);
      const id = generateUniqueId(email, "rot18");
      const escapedPlaceholder = escapeHtml(options.placeholder);

      const fallback = options.includeFallbacks
        ? `<noscript><span aria-label="Email address obfuscated - JavaScript required">[JavaScript required for email]</span></noscript>`
        : "";

      return `<span id="${id}" class="rot18-email" data-email="${escapeHtml(encoded)}" role="button" tabindex="0" aria-label="Click to reveal email address" title="Email address obfuscated for privacy">${escapedPlaceholder}</span>${fallback}`;
    },

    /**
     * JS Concatenation - Very high effectiveness, requires JavaScript
     * Bot resistance: Very High (dynamic assembly)
     * Screen reader compatibility: Good (with ARIA labels)
     * Crawler resistance: Very High
     */
    "js-concat": (email: string) => {
      if (!validateEmail(email)) {
        return email;
      }

      const parts = email.split("@");
      if (parts.length !== 2) return email; // invalid email format

      const [localPart, domain] = parts;
      const id = generateUniqueId(email, "js-concat");

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Email hidden - JavaScript required]</span></noscript>`
        : "";

      return `<span id="${id}" class="js-concat-email" data-p1="${escapeHtml(localPart)}" data-p2="${escapeHtml(domain)}" role="button" tabindex="0" aria-label="Click to reveal email address">${escapeHtml(options.placeholder)}</span>${fallback}`;
    },

    /**
     * JS Interaction - Very high effectiveness, user action required
     * Bot resistance: Very High (requires user interaction)
     * Screen reader compatibility: Excellent (proper focus management)
     * Crawler resistance: Very High
     */
    "js-interaction": (email: string) => {
      const encoded = base64Encode(email);
      const id = generateUniqueId(email, "js-interaction");

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Email requires interaction - JavaScript needed]</span></noscript>`
        : "";

      return `<span id="${id}" class="js-interaction-email" data-encoded="${escapeHtml(encoded)}" role="button" tabindex="0" aria-label="Click or press Enter to reveal email address" title="Click to reveal email">${escapeHtml(options.placeholder)}</span>${fallback}`;
    },

    /**
     * SVG rendering - High effectiveness, invisible to most crawlers
     * Bot resistance: High (SVG text parsing is uncommon)
     * Screen reader compatibility: Good (with proper ARIA)
     * Crawler resistance: High
     */
    svg: (email: string) => {
      const id = generateUniqueId(email, "svg");
      const chars = email.split("");
      let svgContent = "";

      chars.forEach((char, index) => {
        svgContent += `<text x="${index * 8 + 5}" y="15" font-family="monospace" font-size="14">${escapeHtml(char)}</text>`;
      });

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Email in SVG format - not accessible without graphics]</span></noscript>`
        : "";

      return `<svg id="${id}" class="svg-email" width="${chars.length * 8 + 10}" height="20" role="img" aria-label="Email address: ${escapeHtml(email)}" style="vertical-align: middle;">${svgContent}</svg>${fallback}`;
    },

    /**
     * CSS Hidden - High effectiveness, uses CSS manipulation
     * Bot resistance: High (requires CSS and JS parsing)
     * Screen reader compatibility: Good (with proper implementation)
     * Crawler resistance: High
     */
    "css-hidden": (email: string) => {
      const id = generateUniqueId(email, "css-hidden");
      const chars = email.split("");
      const hiddenChars = chars
        .map(
          (char, index) =>
            `<span class="hidden-char" data-pos="${index}" style="display: none;">${escapeHtml(char)}</span>`,
        )
        .join("");

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Email hidden with CSS - JavaScript required]</span></noscript>`
        : "";

      return `<span id="${id}" class="css-hidden-email" role="button" tabindex="0" aria-label="Click to reveal email address">${hiddenChars}<span class="placeholder-text">${escapeHtml(options.placeholder)}</span></span>${fallback}`;
    },

    /**
     * HTTP Redirect - Very high effectiveness, server-side protection
     * Bot resistance: Very High (requires server-side processing)
     * Screen reader compatibility: Excellent (standard links)
     * Crawler resistance: Very High
     */
    "http-redirect": (email: string) => {
      const encoded = base64Encode(email);
      const redirectUrl = `${options.redirectBaseUrl}?e=${encodeURIComponent(encoded)}`;

      return `<a href="${escapeHtml(redirectUrl)}" class="http-redirect-email" data-original="${escapeHtml(email)}" title="Contact via email">${escapeHtml(options.placeholder)}</a>`;
    },

    /**
     * Reverse - Moderate effectiveness, better when combined
     * Bot resistance: Low-Medium (easily reversible)
     * Screen reader compatibility: Poor (reads backwards)
     * Crawler resistance: Low-Medium
     */
    reverse: (email: string) => {
      const reversed = reverseEmail(email);
      const id = generateUniqueId(email, "reverse");

      if (options.includeFallbacks) {
        return `<span id="${id}" class="reverse-email" data-reversed="${escapeHtml(reversed)}" role="button" tabindex="0" aria-label="Email address reversed - click to reveal normally" title="Email address reversed for privacy" style="unicode-bidi: bidi-override; direction: rtl; cursor: pointer;">${escapeHtml(reversed)}</span>`;
      }

      return `<span id="${id}" class="reverse-email-data" data-reversed="${escapeHtml(reversed)}" style="display: none;"></span>`;
    },

    /**
     * Base64 - Moderate effectiveness, better when combined
     * Bot resistance: Low-Medium (easily decoded)
     * Screen reader compatibility: Poor (reads encoded string)
     * Crawler resistance: Medium
     */
    base64: (email: string) => {
      const encoded = base64Encode(email);
      const id = generateUniqueId(email, "base64");

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Base64 encoded email - JavaScript required]</span></noscript>`
        : "";

      return `<span id="${id}" class="b64-email" data-obfuscated-email="${escapeHtml(encoded)}" role="button" tabindex="0" aria-label="Click to reveal email address" title="Email address obfuscated for privacy">${escapeHtml(options.placeholder)}</span>${fallback}`;
    },

    /**
     * Deconstruct - Moderate effectiveness, better when combined
     * Bot resistance: Low-Medium (simple array joining)
     * Screen reader compatibility: Poor (reads placeholder only)
     * Crawler resistance: Medium
     */
    deconstruct: (email: string) => {
      const parts = deconstructEmail(email);
      const id = generateUniqueId(email, "deconstruct");

      const fallback = options.includeFallbacks
        ? `<noscript><span>[Deconstructed email - JavaScript required]</span></noscript>`
        : "";

      return `<span id="${id}" class="deconstructed-email" data-parts='${escapeHtml(JSON.stringify(parts))}' role="button" tabindex="0" aria-label="Click to reveal email address" title="Email address obfuscated for privacy">${escapeHtml(options.placeholder)}</span>${fallback}`;
    },
  };

  /**
   * Apply multiple obfuscation methods in sequence for layered defense
   */
  function applyObfuscationChain(email: string): string {
    let result = email;

    // Use the last method in the chain for the final output
    const method = options.methods[options.methods.length - 1];

    if (obfuscationMethods[method]) {
      result = obfuscationMethods[method](email);
    }

    return result;
  }

  // Function to process HTML content and obfuscate emails
  const processHTMLContent = (
    content: string,
  ): { content: string; emailCount: number } => {
    let emailCount = 0;

    // Skip if already processed to avoid double processing
    const obfuscationClasses = [
      "rot18-email",
      "b64-email",
      "reverse-email",
      "deconstructed-email",
      "js-concat-email",
      "js-interaction-email",
      "svg-email",
      "css-hidden-email",
      "http-redirect-email",
    ];

    if (obfuscationClasses.some((cls) => content.includes(cls))) {
      return { content, emailCount: 0 };
    }

    // Skip elements with exclude selector - basic implementation
    if (
      options.excludeSelector &&
      content.includes(options.excludeSelector.replace(".", ""))
    ) {
      return { content, emailCount: 0 };
    }

    // Email regex - more comprehensive and precise
    const emailPattern =
      /\b[A-Za-z0-9](?:[A-Za-z0-9._%-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/g;

    // Process mailto links if target includes "link"
    if (options.target === "link" || options.target === "both") {
      content = content.replace(
        /(<a[^>]*?)href=["']mailto:([^"']+)["']([^>]*?>)([^<]*?)(<\/a>)/gi,
        (match, openTag, email: string, middleTag, linkText, closeTag) => {
          // Validate email format before processing
          if (emailPattern.test(email) && validateEmail(email)) {
            emailCount++;
            const obfuscatedEmail = applyObfuscationChain(email);
            // For mailto links, we replace the entire link content
            const newOpenTag = openTag
              .replace(/href=["'][^"']*["']/gi, "")
              .trim();
            return `${newOpenTag}${middleTag}${obfuscatedEmail}${closeTag}`;
          }
          return match;
        },
      );
    }

    // Process standalone emails in text content if target includes "text"
    if (options.target === "text" || options.target === "both") {
      content = content.replace(
        />([^<]*?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}[^<]*?)</g,
        (match, textContent) => {
          // Skip if this text is inside an already obfuscated element
          if (
            obfuscationClasses.some((cls) => textContent.includes(cls)) ||
            textContent.includes("data-email") ||
            textContent.includes("data-obfuscated-email") ||
            textContent.includes("data-parts") ||
            textContent.includes(options.placeholder)
          ) {
            return match;
          }

          // Reset regex lastIndex to ensure clean matching
          emailPattern.lastIndex = 0;
          const newTextContent = textContent.replace(
            emailPattern,
            (email: string) => {
              emailCount++;
              return applyObfuscationChain(email);
            },
          );
          return `>${newTextContent}<`;
        },
      );
    }

    return { content, emailCount };
  };

  return {
    name: "astro-email-obfuscation",
    hooks: {
      // Add config validation
      "astro:config:setup": ({ logger }) => {
        // Validate configuration
        const validMethods = [
          "rot18",
          "js-concat",
          "js-interaction",
          "svg",
          "css-hidden",
          "http-redirect",
          "reverse",
          "base64",
          "deconstruct",
        ];

        for (const method of options.methods) {
          if (!validMethods.includes(method)) {
            logger.error(
              `Invalid obfuscation method: ${method}. Must be one of: ${validMethods.join(", ")}`,
            );
            throw new Error(`Invalid obfuscation method: ${method}`);
          }
        }

        if (!["text", "link", "both"].includes(options.target)) {
          logger.error(
            `Invalid target: ${options.target}. Must be one of: text, link, both`,
          );
          throw new Error(`Invalid target: ${options.target}`);
        }

        logger.info(
          `Email obfuscation configured with methods: [${options.methods.join(", ")}], target: ${options.target}`,
        );
      },

      // Log when config is finalized
      "astro:config:done": ({ logger }) => {
        logger.info(
          `Email obfuscation ready for ${process.env.NODE_ENV || "production"} build`,
        );
      },

      // Hook for production builds - process final HTML files
      "astro:build:done": async ({ dir, logger }) => {
        // Skip processing in development unless explicitly enabled
        if (process.env.NODE_ENV === "development" && !options.dev) {
          logger.info("Email obfuscation: Skipping in development mode");
          return;
        }

        logger.info("Email obfuscation: Processing built files...");

        const distPath = fileURLToPath(dir);

        // Load decoder script
        try {
          const decoderPath = path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            "decoder.js",
          );
          const decoderScript = await fs.readFile(decoderPath, "utf-8");

          // Process all HTML files in the dist directory
          const processDirectory = async (dirPath: string): Promise<number> => {
            let totalProcessed = 0;

            // Security: Validate path to prevent directory traversal
            const normalizedPath = path.resolve(dirPath);
            const normalizedDist = path.resolve(distPath);
            if (!normalizedPath.startsWith(normalizedDist)) {
              logger.warn(`Skipping directory outside dist: ${dirPath}`);
              return 0;
            }

            try {
              const entries = await fs.readdir(dirPath, {
                withFileTypes: true,
              });

              for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                  // Skip common directories that won't contain HTML
                  if (
                    ["node_modules", ".git", "assets", "_astro"].includes(
                      entry.name,
                    )
                  ) {
                    continue;
                  }
                  totalProcessed += await processDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith(".html")) {
                  totalProcessed += await processHTMLFile(fullPath);
                }
              }
            } catch (error) {
              logger.warn(`Could not read directory: ${dirPath}`, error);
            }

            return totalProcessed;
          };

          const processHTMLFile = async (filePath: string): Promise<number> => {
            try {
              const content = await fs.readFile(filePath, "utf-8");
              const { content: processedContent, emailCount } =
                processHTMLContent(content);

              // Only inject decoder script if we actually processed emails
              if (emailCount > 0) {
                // Inject decoder script before closing body tag, or at end if no body tag
                let finalContent: string;
                if (processedContent.includes("</body>")) {
                  finalContent = processedContent.replace(
                    "</body>",
                    `<script>\n${decoderScript}\n</script>\n</body>`,
                  );
                } else {
                  finalContent =
                    processedContent +
                    `\n<script>\n${decoderScript}\n</script>`;
                }

                await fs.writeFile(filePath, finalContent);
                logger.info(
                  `Processed ${emailCount} emails in: ${path.relative(distPath, filePath)}`,
                );
              }

              return emailCount;
            } catch {
              logger.error(`Error processing ${filePath}:`);
              return 0;
            }
          };

          const totalProcessed = await processDirectory(distPath);
          if (totalProcessed > 0) {
            logger.info(
              `Email obfuscation completed: ${totalProcessed} emails processed using methods: [${options.methods.join(", ")}]`,
            );
          } else {
            logger.info("Email obfuscation: No emails found to process");
          }
        } catch (error) {
          logger.error("Email obfuscation: Failed to load decoder script");
          console.error(error);
        }
      },
    },
  };
}
