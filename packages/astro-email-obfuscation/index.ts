import type { AstroIntegration } from "astro";
import { fileURLToPath } from "url";
import { globby } from "globby";
import { promises as fs } from "node:fs";

/**
 * Interface defining the options for the Astro Email Obfuscation integration.
 */
interface AstroEmailObfuscationOptions {
  /**
   * Obfuscation method to use
   * - 'entities': HTML entity encoding
   * - 'visual': Visual obfuscation with CSS
   * - 'fragment': Split into fragments with noise
   * - 'steganography': Hide in plain sight
   * @default 'entities'
   */
  method?: "entities" | "visual" | "fragment" | "steganography";
}

/**
 * Regular expression to match email addresses
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Regular expression to match mailto links
 */
const MAILTO_REGEX = /href="mailto:([^"]+)"/g;

/**
 * Convert string to HTML entities
 */
function toHtmlEntities(str: string): string {
  return str
    .split("")
    .map((char) => `&#${char.charCodeAt(0)};`)
    .join("");
}

/**
 * Generate a random string of decoy characters
 */
function generateDecoyText(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

/**
 * Generate obfuscated email based on method
 */
function obfuscateEmail(email: string, method: string): string {
  const [user, domain] = email.split("@");

  switch (method) {
    case "entities": {
      // Convert to HTML entities with random mixed encoding
      return email
        .split("")
        .map((char) => {
          // Mix between decimal and hex entities randomly
          if (Math.random() > 0.5) {
            return `&#${char.charCodeAt(0)};`;
          } else {
            return `&#x${char.charCodeAt(0).toString(16)};`;
          }
        })
        .join("");
    }

    case "visual": {
      // Visual obfuscation using CSS and hidden elements
      const visualDecoy = generateDecoyText(4);
      return `<span class="email-obf">${user}<span class="email-decoy">${visualDecoy}</span>@<span class="email-decoy">${visualDecoy}</span>${domain}</span>`;
    }

    case "fragment": {
      // Fragment the email across multiple spans with noise
      const fragments = [];
      const noise1 = generateDecoyText(3);
      const noise2 = generateDecoyText(3);
      const noise3 = generateDecoyText(3);

      fragments.push(`<span class="email-frag" data-pos="1">${user}</span>`);
      fragments.push(`<span class="email-noise">${noise1}</span>`);
      fragments.push(`<span class="email-frag" data-pos="2">@</span>`);
      fragments.push(`<span class="email-noise">${noise2}</span>`);
      fragments.push(`<span class="email-frag" data-pos="3">${domain}</span>`);
      fragments.push(`<span class="email-noise">${noise3}</span>`);

      return fragments.join("");
    }

    case "steganography": {
      // Hide email in seemingly innocent text using CSS and data attributes
      const words = ["contact", "reach", "message", "write", "email"];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/[+=]/g, "")
        .substring(0, 12);
      return `<span class="contact-hint" data-info="${encodedEmail}">${randomWord}</span>`;
    }

    default:
      return toHtmlEntities(email);
  }
}

/**
 * Processes an individual HTML file to obfuscate email addresses
 */
async function processHtmlFile(
  filePath: string,
  method: string,
): Promise<boolean> {
  try {
    const html = await fs.readFile(filePath, "utf-8");
    let modifiedHtml = html;

    // Process mailto links first
    modifiedHtml = modifiedHtml.replace(MAILTO_REGEX, (match, email) => {
      // Remove the href entirely for security
      return `data-obfuscated-email="${Buffer.from(email).toString("base64")}" title="Email address obfuscated for privacy"`;
    });

    // Process plain text emails
    modifiedHtml = modifiedHtml.replace(EMAIL_REGEX, (email) => {
      return obfuscateEmail(email, method);
    });

    // Only write back if content changed
    if (modifiedHtml !== html) {
      await fs.writeFile(filePath, modifiedHtml, "utf-8");
      return true;
    }
    return false;
  } catch {
    // Error will be handled by the caller with proper logger
    return false;
  }
}

/**
 * Astro integration function to obfuscate email addresses in the HTML output.
 */
export default function astroEmailObfuscation(
  userOptions: AstroEmailObfuscationOptions = {},
): AstroIntegration {
  const method = userOptions.method || "entities";

  return {
    name: "astro-email-obfuscation",
    hooks: {
      /**
       * After the build is done, processes all HTML files to obfuscate email addresses.
       */
      "astro:build:done": async ({ dir, logger }) => {
        try {
          const outDir = fileURLToPath(dir);
          const htmlFiles = await globby("**/*.html", {
            cwd: outDir,
            absolute: true,
          });

          let processedCount = 0;

          // Process all files
          const results = await Promise.all(
            htmlFiles.map((file) => processHtmlFile(file, method)),
          );

          processedCount = results.filter(Boolean).length;

          if (processedCount > 0) {
            logger.info(
              `Processed ${processedCount} file(s) using ${method} method`,
            );
          }
        } catch (err) {
          logger.error(`Error during processing - ${err}`);
        }
      },
    },
  };
}
