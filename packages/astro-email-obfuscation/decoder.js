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
  return anchor;
}

// Apply clickable styles to an element
function makeClickable(element) {
  // Remove hardcoded styles
  element.style.cursor = "pointer";
}

// Initialize decoders when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Handle ROT18 emails
  document.querySelectorAll(".rot18-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const encodedEmail = this.getAttribute("data-email");
      if (encodedEmail) {
        const decodedEmail = rot18(encodedEmail);
        const anchor = createEmailLink(decodedEmail);

        // Replace element content safely
        this.innerHTML = "";
        this.appendChild(anchor);
        this.classList.remove("rot18-email");
        this.removeAttribute("data-email");
      }
    });

    makeClickable(element);
  });

  // Handle reverse emails (they're already reversed with CSS, no click needed)
  document.querySelectorAll(".reverse-email").forEach(function (element) {
    element.title = "Email address reversed for privacy";
  });

  // Handle deconstructed emails
  document.querySelectorAll(".deconstructed-email").forEach(function (element) {
    element.addEventListener("click", function () {
      try {
        const partsData = this.getAttribute("data-parts");
        if (partsData) {
          const parts = JSON.parse(partsData);
          if (parts && Array.isArray(parts)) {
            const decodedEmail = parts.join("");
            const anchor = createEmailLink(decodedEmail);

            // Replace element content safely
            this.innerHTML = "";
            this.appendChild(anchor);
            this.classList.remove("deconstructed-email");
            this.removeAttribute("data-parts");
          }
        }
      } catch (e) {
        console.error("Failed to decode deconstructed email:", e);
      }
    });

    makeClickable(element);
  });

  // Handle base64 encoded emails in data attributes
  document.querySelectorAll(".b64-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const encodedEmail = this.getAttribute("data-obfuscated-email");
      if (encodedEmail) {
        try {
          const decodedEmail = atob(encodedEmail);
          const anchor = createEmailLink(decodedEmail);

          // Replace element content safely
          this.innerHTML = "";
          this.appendChild(anchor);
          this.classList.remove("b64-email");
          this.removeAttribute("data-obfuscated-email");
        } catch (e) {
          console.error("Failed to decode base64 email:", e);
        }
      }
    });

    makeClickable(element);
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
            const anchor = createEmailLink(decodedEmail);

            // Replace element content safely
            this.innerHTML = "";
            this.appendChild(anchor);
            this.removeAttribute("data-obfuscated-email");
          } catch (e) {
            console.error("Failed to decode legacy base64 email:", e);
          }
        }
      });

      makeClickable(element);
    });
});
