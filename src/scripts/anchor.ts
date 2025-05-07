/**
 * Handles smooth scrolling for in-page anchor links
 */
class AnchorScroll {
  /**
   * Initialize smooth scrolling for in-page anchor links
   */
  static init(): void {
    document.addEventListener("DOMContentLoaded", () => {
      // Smooth scroll for anchor links
      document
        .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
        .forEach((anchor) => {
          anchor.addEventListener("click", (e: MouseEvent) => {
            e.preventDefault();
            const targetId = anchor.getAttribute("href");

            if (targetId) {
              const targetElement =
                document.querySelector<HTMLElement>(targetId);

              if (targetElement) {
                targetElement.scrollIntoView({
                  behavior: "smooth",
                });
              }
            }
          });
        });
    });
  }
}

// Initialize anchor scrolling
AnchorScroll.init();

export default AnchorScroll;
