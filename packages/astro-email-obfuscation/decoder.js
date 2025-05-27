// ROT13 decoder
function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function (char) {
    const start = char <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((char.charCodeAt(0) - start + 13) % 26) + start,
    );
  });
}

// Initialize decoders when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Handle ROT13 emails
  document.querySelectorAll(".rot13-email").forEach(function (element) {
    element.addEventListener("click", function () {
      const encodedEmail = this.getAttribute("data-email");
      if (encodedEmail) {
        const decodedEmail = rot13(encodedEmail);

        // Create anchor element safely
        const anchor = document.createElement("a");
        anchor.href = "mailto:" + decodedEmail;
        anchor.textContent = decodedEmail;

        // Replace element content safely
        this.innerHTML = "";
        this.appendChild(anchor);
        this.classList.remove("rot13-email");
      }
    });

    // Make it look clickable
    element.style.cursor = "pointer";
    element.style.textDecoration = "underline";
    element.style.color = "#0066cc";
  });

  // Handle reverse emails (they're already reversed with CSS, no click needed)
  document.querySelectorAll(".reverse-email").forEach(function (element) {
    element.title = "Email address reversed for privacy";
  });

  // Handle base64 encoded emails in data attributes
  document
    .querySelectorAll("[data-obfuscated-email]")
    .forEach(function (element) {
      element.addEventListener("click", function () {
        const encodedEmail = this.getAttribute("data-obfuscated-email");
        if (encodedEmail) {
          try {
            const decodedEmail = atob(encodedEmail);

            // Create anchor element safely
            const anchor = document.createElement("a");
            anchor.href = "mailto:" + decodedEmail;
            anchor.textContent = decodedEmail;

            // Replace element content safely
            this.innerHTML = "";
            this.appendChild(anchor);
            this.removeAttribute("data-obfuscated-email");
          } catch (e) {
            console.error("Failed to decode email:", e);
          }
        }
      });

      // Make it look clickable
      element.style.cursor = "pointer";
      element.style.textDecoration = "underline";
      element.style.color = "#0066cc";
      element.textContent = "[Click to reveal email]";
    });
});
