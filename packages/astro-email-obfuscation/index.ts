import type { AstroIntegration } from "astro";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

interface AstroEmailObfuscationOptions {
  method?: "rot18" | "reverse" | "base64" | "deconstruct";
  dev?: boolean;
  excludeSelector?: string;
  placeholder?: string;
}

export default function astroEmailObfuscation(
  userOptions: AstroEmailObfuscationOptions = {},
): AstroIntegration {
  const options = {
    method: userOptions.method || "rot18",
    dev: userOptions.dev || false,
    excludeSelector: userOptions.excludeSelector || ".no-obfuscate",
    placeholder: userOptions.placeholder || "[Click to reveal email]",
  } as const;

  // ROT18 encoding (ROT13 for letters + ROT5 for numbers)
  function rot18(str: string): string {
    return str.replace(/[a-zA-Z0-9]/g, function (char) {
      if (char >= "0" && char <= "9") {
        // ROT5 for digits
        return String.fromCharCode(((char.charCodeAt(0) - 48 + 5) % 10) + 48);
      } else {
        // ROT13 for letters
        const start = char <= "Z" ? 65 : 97;
        return String.fromCharCode(
          ((char.charCodeAt(0) - start + 13) % 26) + start,
        );
      }
    });
  }

  // Base64 encode email
  function base64Encode(str: string): string {
    return Buffer.from(str).toString("base64");
  }

  // Split email into parts for deconstruction
  function deconstructEmail(email: string): string[] {
    return email.split("");
  }

  // Reverse email string
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

  const obfuscationMethods = {
    rot18: (email: string) => {
      const encoded = rot18(email);
      const escapedPlaceholder = escapeHtml(options.placeholder);
      return `<span class="rot18-email" data-email="${escapeHtml(encoded)}" title="Email address obfuscated for privacy">${escapedPlaceholder}</span>`;
    },

    base64: (email: string) => {
      const encoded = base64Encode(email);
      const escapedPlaceholder = escapeHtml(options.placeholder);
      return `<span class="b64-email" data-obfuscated-email="${escapeHtml(encoded)}" title="Email address obfuscated for privacy">${escapedPlaceholder}</span>`;
    },

    reverse: (email: string) => {
      const reversed = reverseEmail(email);
      return `<span class="reverse-email" title="Email address reversed for privacy" style="unicode-bidi: bidi-override; direction: rtl;">${escapeHtml(reversed)}</span>`;
    },

    deconstruct: (email: string) => {
      const parts = deconstructEmail(email);
      const escapedPlaceholder = escapeHtml(options.placeholder);
      return `<span class="deconstructed-email" data-parts='${escapeHtml(JSON.stringify(parts))}' title="Email address obfuscated for privacy">${escapedPlaceholder}</span>`;
    },
  };

  // Function to process HTML content and obfuscate emails
  const processHTMLContent = (
    content: string,
  ): { content: string; emailCount: number } => {
    let emailCount = 0;

    // Skip if already processed to avoid double processing
    if (
      content.includes("rot18-email") ||
      content.includes("b64-email") ||
      content.includes("reverse-email") ||
      content.includes("deconstructed-email")
    ) {
      return { content, emailCount: 0 };
    }

    // Skip elements with exclude selector - basic implementation
    if (
      options.excludeSelector &&
      content.includes(options.excludeSelector.replace(".", ""))
    ) {
      // More sophisticated exclude check could be implemented with DOM parsing if needed
      return { content, emailCount: 0 };
    }

    // Email regex - more comprehensive and precise
    const emailPattern =
      /\b[A-Za-z0-9](?:[A-Za-z0-9._%-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/g;

    // Process mailto links - replace ENTIRE link element
    content = content.replace(
      /(<a[^>]*?)href=["']mailto:([^"']+)["']([^>]*?>)([^<]*?)(<\/a>)/gi,
      (match, openTag, email: string, middleTag, linkText, closeTag) => {
        // Validate email format before processing
        if (emailPattern.test(email)) {
          emailCount++;
          const obfuscatedEmail = obfuscationMethods[options.method](email);
          // Remove href and replace entire inner content
          const newOpenTag = openTag
            .replace(/href=["'][^"']*["']/gi, "")
            .trim();
          return `<${newOpenTag.substring(1)}${middleTag}${obfuscatedEmail}${closeTag}`;
        }
        return match;
      },
    );

    // Process standalone emails in text content ONLY (not in attributes)
    // This regex finds text content between tags, avoiding script and style content
    content = content.replace(
      />([^<]*?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}[^<]*?)</g,
      (match, textContent) => {
        // Skip if this text is inside an already obfuscated element
        if (
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
            return obfuscationMethods[options.method](email);
          },
        );
        return `>${newTextContent}<`;
      },
    );

    return { content, emailCount };
  };

  return {
    name: "astro-email-obfuscation",
    hooks: {
      // Add config validation
      "astro:config:setup": ({ logger }) => {
        // Validate configuration
        if (
          !["rot18", "reverse", "base64", "deconstruct"].includes(
            options.method,
          )
        ) {
          logger.error(
            `Invalid obfuscation method: ${options.method}. Must be one of: rot18, reverse, base64, deconstruct`,
          );
          throw new Error(`Invalid obfuscation method: ${options.method}`);
        }

        logger.info(
          `Email obfuscation configured with method: ${options.method}`,
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
              logger.warn(`Could not read directory: ${dirPath}`);
            }

            return totalProcessed;
          };

          const processHTMLFile = async (filePath: string): Promise<number> => {
            try {
              let content = await fs.readFile(filePath, "utf-8");
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
            } catch (error) {
              logger.error(`Error processing ${filePath}:`);
              console.error(error);
              return 0;
            }
          };

          const totalProcessed = await processDirectory(distPath);
          if (totalProcessed > 0) {
            logger.info(
              `Email obfuscation completed: ${totalProcessed} emails processed using ${options.method} method`,
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
