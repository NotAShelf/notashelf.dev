/**
 * Email Obfuscation Decoder - Client-side JavaScript
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

// Apply interactive styles to an element
function makeInteractive(element) {
  element.style.cursor = "pointer";
  element.style.textDecoration = "underline";
  element.style.color = "inherit";

  // Add keyboard support
  element.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      element.click();
    }
  });
}

// Enhanced email reveal with animation
function revealEmail(element, email, animated = true) {
  const anchor = createEmailLink(email);

  if (animated) {
    element.style.opacity = "0.5";
    setTimeout(() => {
      element.innerHTML = "";
      element.appendChild(anchor);
      element.style.opacity = "1";
      element.style.cursor = "default";
      element.style.textDecoration = "none";
    }, 150);
  } else {
    element.innerHTML = "";
    element.appendChild(anchor);
    element.style.cursor = "default";
    element.style.textDecoration = "none";
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
          this.style.fontStyle = "italic";
          setTimeout(() => {
            if (clickCount === 1) {
              this.textContent =
                this.getAttribute("data-original-text") ||
                "[Click to reveal email]";
              this.style.fontStyle = "normal";
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
    element.style.cursor = "pointer";
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
          char.style.display = "inline";
        });

        if (placeholder) {
          placeholder.style.display = "none";
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
      // Add a small delay to show interaction feedback
      this.style.opacity = "0.7";
      setTimeout(() => {
        this.style.opacity = "1";
      }, 100);
    });
  });

  // Handle Reverse emails - Moderate effectiveness, better UX when clickable
  document.querySelectorAll(".reverse-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const reversedEmail = this.getAttribute("data-reversed");
      if (reversedEmail) {
        const email = reversedEmail.split("").reverse().join("");
        revealEmail(this, email);
        this.classList.remove("reverse-email");
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

  // Add global styles for better UX
  const style = document.createElement("style");
  style.textContent = `
    .rot18-email, .js-concat-email, .js-interaction-email, 
    .css-hidden-email, .reverse-email[data-reversed], 
    .deconstructed-email, .b64-email {
      transition: opacity 0.15s ease-in-out;
    }
    
    .css-hidden-email .hidden-char {
      transition: display 0.3s ease-in-out;
    }
    
    .svg-email:hover {
      opacity: 0.8;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .rot18-email, .js-concat-email, .js-interaction-email, 
      .css-hidden-email, .reverse-email[data-reversed], 
      .deconstructed-email, .b64-email, .svg-email {
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
});
