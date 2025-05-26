/**
 * Unified page utilities for common functionality:
 * - Fade-in animations
 * - Smooth scrolling
 * - Scroll arrow animation
 */
class PageUtils {
  private static readonly FADE_CLASS = "fade-in";
  private static readonly VISIBLE_CLASS = "visible";
  private static readonly ANIMATE_CLASS = "animate";
  private static readonly THRESHOLD = 0.1;

  static init(): void {
    document.addEventListener("DOMContentLoaded", () => {
      this.initFadeElements();
      this.initSmoothScroll();
      this.initScrollArrow();
    });
  }

  static initFadeElements(): void {
    const fadeElements = document.querySelectorAll<HTMLElement>(
      `.${this.FADE_CLASS}`,
    );
    if (fadeElements.length === 0) return;

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

  static initSmoothScroll(): void {
    document
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((anchor) => {
        anchor.addEventListener("click", (e: MouseEvent) => {
          e.preventDefault();
          const targetId = anchor.getAttribute("href");

          if (targetId) {
            const targetElement = document.querySelector<HTMLElement>(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          }
        });
      });
  }

  static initScrollArrow(): void {
    const scrollArrow = document.querySelector<HTMLElement>(".scroll-arrow");
    if (scrollArrow) {
      scrollArrow.classList.add(this.ANIMATE_CLASS);
    }
  }
}

PageUtils.init();

export default PageUtils;
