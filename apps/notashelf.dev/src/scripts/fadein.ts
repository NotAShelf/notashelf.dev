/**
 * Handles fade-in animation for elements as they enter the viewport
 */
class FadeInAnimator {
  private static readonly VISIBLE_CLASS = "visible";
  private static readonly FADE_CLASS = "fade-in";
  private static readonly THRESHOLD = 0.1;

  /**
   * Initialize the fade-in observer for elements with the fade-in class
   */
  static init(): void {
    document.addEventListener("DOMContentLoaded", () => {
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
    });
  }
}

// Initialize fade-in animations
FadeInAnimator.init();

export default FadeInAnimator;
