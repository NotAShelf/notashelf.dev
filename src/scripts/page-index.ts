/**
 * Handles various page initialization features:
 * - Fade-in animations
 * - Smooth scrolling
 * - Scroll arrow animation
 */
class PageIndex {
  private static readonly FADE_CLASS = "fade-in";
  private static readonly VISIBLE_CLASS = "visible";
  private static readonly ANIMATE_CLASS = "animate";
  private static readonly THRESHOLD = 0.1;

  /**
   * Initialize the page with all interactive elements
   */
  static init(): void {
    document.addEventListener("DOMContentLoaded", () => {
      this.initFadeElements();
      this.initSmoothScroll();
      this.initScrollArrow();
    });
  }

  /**
   * Initialize fade-in animations for elements
   */
  private static initFadeElements(): void {
    const fadeElements = document.querySelectorAll<HTMLElement>(
      `.${this.FADE_CLASS}`,
    );

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(this.VISIBLE_CLASS);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: this.THRESHOLD },
    );

    fadeElements.forEach((el) => observer.observe(el));
  }

  /**
   * Initialize smooth scrolling for anchor links
   */
  private static initSmoothScroll(): void {
    document
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((anchor) => {
        anchor.addEventListener("click", (e: MouseEvent) => {
          e.preventDefault();
          const targetId = anchor.getAttribute("href");

          if (targetId) {
            const targetElement = document.querySelector<HTMLElement>(targetId);

            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: "smooth",
              });
            }
          }
        });
      });
  }

  /**
   * Initialize scroll arrow animation
   */
  private static initScrollArrow(): void {
    const scrollArrow = document.querySelector<HTMLElement>(".scroll-arrow");
    if (scrollArrow) {
      scrollArrow.classList.add(this.ANIMATE_CLASS);
    }
  }
}

// Initialize the page
PageIndex.init();

export default PageIndex;
