/**
 * Email Obfuscation Decoder - Client-side JavaScript for Astro Email
 * Obfuscation integration.
 * Handles multiple obfuscation methods with accessibility and fallback support
 */

// ROT18 decoder (ROT13 for letters + ROT5 for numbers)
function rot18(str) {
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

// Safely create and return an anchor element
function createEmailLink(email) {
  const anchor = document.createElement("a");
  anchor.href = "mailto:" + email;
  anchor.textContent = email;
  anchor.setAttribute("aria-label", "Send email to " + email);
  return anchor;
}

// Apply interactive styles to an element using CSS classes
function makeInteractive(element) {
  element.classList.add("email-obfuscation-interactive");

  // Add keyboard support
  element.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      element.click();
    }
  });
}

// Email reveal with animations
function revealEmail(element, email, animated = true) {
  const anchor = createEmailLink(email);

  if (animated) {
    element.classList.add("email-obfuscation-revealing");
    setTimeout(() => {
      // Safely clear content and append new element
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(anchor);
      element.classList.remove(
        "email-obfuscation-revealing",
        "email-obfuscation-interactive",
      );
      element.classList.add("email-obfuscation-revealed");
    }, 150);
  } else {
    // Safely clear content and append new element
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    element.appendChild(anchor);
    element.classList.remove("email-obfuscation-interactive");
    element.classList.add("email-obfuscation-revealed");
  }
}

// Initialize all decoders when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Handle ROT18 emails - High effectiveness method
  document.querySelectorAll(".rot18-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const encodedEmail = this.getAttribute("data-email");
      if (encodedEmail) {
        const decodedEmail = rot18(encodedEmail);
        revealEmail(this, decodedEmail);
        this.classList.remove("rot18-email");
        this.removeAttribute("data-email");
      }
    });
    makeInteractive(element);
  });

  // Handle JS Concatenation emails - Very high effectiveness
  document.querySelectorAll(".js-concat-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const part1 = this.getAttribute("data-p1");
      const part2 = this.getAttribute("data-p2");
      if (part1 && part2) {
        const email = part1 + "@" + part2;
        revealEmail(this, email);
        this.classList.remove("js-concat-email");
        this.removeAttribute("data-p1");
        this.removeAttribute("data-p2");
      }
    });
    makeInteractive(element);
  });

  // Handle JS Interaction emails - Very high effectiveness with user action requirement
  document
    .querySelectorAll(".js-interaction-email")
    .forEach(function (element) {
      let clickCount = 0;
      element.addEventListener("click", function () {
        clickCount++;
        if (clickCount === 1) {
          // First click: show confirmation
          this.textContent = "Click again to confirm";
          this.classList.add("email-obfuscation-confirming");
          setTimeout(() => {
            if (clickCount === 1) {
              this.textContent =
                this.getAttribute("data-original-text") ||
                "[Click to reveal email]";
              this.classList.remove("email-obfuscation-confirming");
              clickCount = 0;
            }
          }, 3000);
        } else if (clickCount === 2) {
          // Second click: reveal email
          const encodedEmail = this.getAttribute("data-encoded");
          if (encodedEmail) {
            try {
              const decodedEmail = atob(encodedEmail);
              revealEmail(this, decodedEmail);
              this.classList.remove("js-interaction-email");
              this.removeAttribute("data-encoded");
            } catch (e) {
              console.error("Failed to decode interaction email:", e);
            }
          }
        }
      });

      // Store original text for reset
      element.setAttribute("data-original-text", element.textContent);
      makeInteractive(element);
    });

  // Handle SVG emails - High effectiveness, good for accessibility when properly labeled
  document.querySelectorAll(".svg-email").forEach(function (element) {
    // SVG emails are already visible, but we can add click-to-copy functionality
    element.addEventListener("click", function () {
      const ariaLabel = this.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.startsWith("Email address: ")) {
        const email = ariaLabel.substring("Email address: ".length);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(email).then(() => {
            const originalTitle = this.getAttribute("title") || "";
            this.setAttribute("title", "Email copied to clipboard!");
            setTimeout(() => {
              this.setAttribute("title", originalTitle);
            }, 2000);
          });
        }
      }
    });
    element.classList.add("email-obfuscation-copyable");
    element.setAttribute("title", "Click to copy email to clipboard");
  });

  // Handle CSS Hidden emails - High effectiveness with CSS manipulation
  document.querySelectorAll(".css-hidden-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const hiddenChars = this.querySelectorAll(".hidden-char");
      const placeholder = this.querySelector(".placeholder-text");

      if (hiddenChars.length > 0) {
        let email = "";
        hiddenChars.forEach((char) => {
          email += char.textContent;
          char.classList.add("email-obfuscation-char-visible");
        });

        if (placeholder) {
          placeholder.classList.add("email-obfuscation-hidden");
        }

        // After a brief moment, replace with proper email link
        setTimeout(() => {
          revealEmail(this, email, false);
          this.classList.remove("css-hidden-email");
        }, 500);
      }
    });
    makeInteractive(element);
  });

  // Handle HTTP Redirect emails - Very high effectiveness
  // These are handled server-side, but we can enhance the UX
  document.querySelectorAll(".http-redirect-email").forEach(function (element) {
    element.addEventListener("click", function () {
      // Add a small delay to show interaction feedback using CSS class
      this.classList.add("email-obfuscation-clicking");
      setTimeout(() => {
        this.classList.remove("email-obfuscation-clicking");
      }, 100);
    });
  });

  // Handle Reverse emails - Moderate effectiveness, better UX when clickable
  document
    .querySelectorAll(".reverse-email, .reverse-email-data")
    .forEach(function (element) {
      element.addEventListener("click", function () {
        const reversedEmail = this.getAttribute("data-reversed");
        if (reversedEmail) {
          const email = reversedEmail.split("").reverse().join("");
          revealEmail(this, email);
          this.classList.remove("reverse-email", "reverse-email-data");
          this.removeAttribute("data-reversed");
        }
      });

      if (element.getAttribute("data-reversed")) {
        makeInteractive(element);
      }
    });

  // Handle deconstructed emails - Moderate effectiveness
  document.querySelectorAll(".deconstructed-email").forEach(function (element) {
    element.addEventListener("click", function () {
      try {
        const partsData = this.getAttribute("data-parts");
        if (partsData) {
          const parts = JSON.parse(partsData);
          if (parts && Array.isArray(parts)) {
            const decodedEmail = parts.join("");
            revealEmail(this, decodedEmail);
            this.classList.remove("deconstructed-email");
            this.removeAttribute("data-parts");
          }
        }
      } catch (e) {
        console.error("Failed to decode deconstructed email:", e);
      }
    });
    makeInteractive(element);
  });

  // Handle base64 encoded emails - Moderate effectiveness
  document.querySelectorAll(".b64-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const encodedEmail = this.getAttribute("data-obfuscated-email");
      if (encodedEmail) {
        try {
          const decodedEmail = atob(encodedEmail);
          revealEmail(this, decodedEmail);
          this.classList.remove("b64-email");
          this.removeAttribute("data-obfuscated-email");
        } catch (e) {
          console.error("Failed to decode base64 email:", e);
        }
      }
    });
    makeInteractive(element);
  });

  // Handle legacy base64 emails (for backward compatibility)
  document
    .querySelectorAll("[data-obfuscated-email]:not(.b64-email)")
    .forEach(function (element) {
      element.addEventListener("click", function () {
        const encodedEmail = this.getAttribute("data-obfuscated-email");
        if (encodedEmail) {
          try {
            const decodedEmail = atob(encodedEmail);
            revealEmail(this, decodedEmail);
            this.removeAttribute("data-obfuscated-email");
          } catch (e) {
            console.error("Failed to decode legacy base64 email:", e);
          }
        }
      });
      makeInteractive(element);
    });

  // Add global styles for better UX using CSP-safe method
  const cssId = "email-obfuscation-styles";
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.type = "text/css";

    // Define all CSS rules as an object
    const cssRules = {
      // Interactive state styles
      ".email-obfuscation-interactive": {
        cursor: "pointer",
        "text-decoration": "underline",
        color: "inherit",
      },

      // Revealing animation styles
      ".email-obfuscation-revealing": {
        opacity: "0.5",
      },

      // Revealed state styles
      ".email-obfuscation-revealed": {
        cursor: "default",
        "text-decoration": "none",
      },

      // Confirmation state styles
      ".email-obfuscation-confirming": {
        "font-style": "italic",
      },

      // Copyable cursor
      ".email-obfuscation-copyable": {
        cursor: "pointer",
      },

      // Character visibility
      ".email-obfuscation-char-visible": {
        display: "inline !important",
      },

      // Hidden elements
      ".email-obfuscation-hidden": {
        display: "none !important",
      },

      // Click feedback
      ".email-obfuscation-clicking": {
        opacity: "0.7",
      },

      // Transition styles for smooth animations
      ".rot18-email, .js-concat-email, .js-interaction-email, .css-hidden-email, .reverse-email[data-reversed], .deconstructed-email, .b64-email":
        {
          transition: "opacity 0.15s ease-in-out",
        },

      ".css-hidden-email .hidden-char": {
        transition: "display 0.3s ease-in-out",
      },

      ".svg-email:hover": {
        opacity: "0.8",
      },
    };

    // Build CSS text from rules object
    let cssText = "";
    for (const [selector, rules] of Object.entries(cssRules)) {
      cssText += `${selector} { `;
      for (const [property, value] of Object.entries(rules)) {
        cssText += `${property}: ${value}; `;
      }
      cssText += "} ";
    }

    // Add reduced motion media query
    cssText += `
      @media (prefers-reduced-motion: reduce) {
        .rot18-email, .js-concat-email, .js-interaction-email,
        .css-hidden-email, .reverse-email[data-reversed],
        .deconstructed-email, .b64-email, .svg-email {
          transition: none !important;
        }
      }
    `;

    style.textContent = cssText;
    document.head.appendChild(style);
  }
});
