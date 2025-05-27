import type { AstroIntegration } from "astro";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

interface AstroEmailObfuscationOptions {
  method?:
    | "entities"
    | "visual"
    | "fragment"
    | "steganography"
    | "rot13"
    | "reverse"
    | "base64";
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const MAILTO_REGEX = /href="mailto:([^"]+)"/g;

function generateDecoyText(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((char.charCodeAt(0) - start + 13) % 26) + start,
    );
  });
}

function obfuscateEmail(email: string, method: string): string {
  const [user, domain] = email.split("@");

  switch (method) {
    case "rot13":
      return `<span class="rot13-email" data-email="${rot13(email)}">[Click to reveal email]</span>`;

    case "reverse":
      return `<span class="reverse-email" style="unicode-bidi: bidi-override; direction: rtl;">${email.split("").reverse().join("")}</span>`;

    case "base64":
      return `<span data-obfuscated-email="${Buffer.from(email).toString("base64")}">[Click to reveal email]</span>`;

    case "entities": {
      return email
        .split("")
        .map((char) => {
          if (Math.random() > 0.5) {
            return `&#${char.charCodeAt(0)};`;
          } else {
            return `&#x${char.charCodeAt(0).toString(16)};`;
          }
        })
        .join("");
    }

    case "visual": {
      const visualDecoy = generateDecoyText(4);
      return `<span class="email-obf">${user}<span class="email-decoy">${visualDecoy}</span>@<span class="email-decoy">${visualDecoy}</span>${domain}</span>`;
    }

    case "fragment": {
      const noise1 = generateDecoyText(3);
      const noise2 = generateDecoyText(3);
      const noise3 = generateDecoyText(3);

      return [
        `<span class="email-frag" data-pos="1">${user}</span>`,
        `<span class="email-noise">${noise1}</span>`,
        `<span class="email-frag" data-pos="2">@</span>`,
        `<span class="email-noise">${noise2}</span>`,
        `<span class="email-frag" data-pos="3">${domain}</span>`,
        `<span class="email-noise">${noise3}</span>`,
      ].join("");
    }

    case "steganography": {
      const words = ["contact", "reach", "message", "write", "email"];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/[+=]/g, "")
        .substring(0, 12);
      return `<span class="contact-hint" data-info="${encodedEmail}">${randomWord}</span>`;
    }

    default:
      return email
        .split("")
        .map((char) => `&#${char.charCodeAt(0)};`)
        .join("");
  }
}

function processHTML(
  html: string,
  method: string,
): { content: string; count: number } {
  let modifiedHTML = html;
  let count = 0;

  modifiedHTML = modifiedHTML.replace(MAILTO_REGEX, (match, email) => {
    count++;
    return `data-obfuscated-email="${Buffer.from(email).toString("base64")}" title="Email address obfuscated for privacy"`;
  });

  modifiedHTML = modifiedHTML.replace(EMAIL_REGEX, (email) => {
    count++;
    return obfuscateEmail(email, method);
  });

  return { content: modifiedHTML, count };
}

function processDirectory(dirPath: string, method: string): number {
  let totalProcessed = 0;
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      totalProcessed += processDirectory(filePath, method);
    } else if (file.endsWith(".html")) {
      const content = readFileSync(filePath, "utf-8");
      const { content: processed, count } = processHTML(content, method);

      if (count > 0) {
        writeFileSync(filePath, processed, "utf-8");
        totalProcessed += count;
      }
    }
  }

  return totalProcessed;
}

export default function astroEmailObfuscation(
  userOptions: AstroEmailObfuscationOptions = {},
): AstroIntegration {
  const method = userOptions.method || "entities";

  return {
    name: "astro-email-obfuscation",
    hooks: {
      "astro:config:setup": ({ injectScript, addWatchFile, updateConfig }) => {
        const decoderPath = join(
          dirname(fileURLToPath(import.meta.url)),
          "decoder.js",
        );
        const decoderContent = readFileSync(decoderPath, "utf-8");

        addWatchFile(decoderPath);

        updateConfig({
          vite: {
            plugins: [
              {
                name: "email-decoder-plugin",
                resolveId(id) {
                  if (id === "virtual:email-decoder") {
                    return id;
                  }
                },
                load(id) {
                  if (id === "virtual:email-decoder") {
                    return decoderContent;
                  }
                },
              },
            ],
          },
        });

        injectScript("page", `import 'virtual:email-decoder';`);
      },
      "astro:build:done": ({ dir, logger }) => {
        const totalProcessed = processDirectory(dir.pathname, method);
        logger.info(
          `Obfuscated ${totalProcessed} emails using ${method} method`,
        );
      },
    },
  };
}
