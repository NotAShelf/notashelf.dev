/**
 * Manages the table of contents (ToC) highlighting and scrolling behavior
 */
class PostTableOfContents {
  private static readonly HEADING_SELECTOR =
    ".post-content h2, .post-content h3";
  private static readonly TOC_ITEM_SELECTOR = ".toc-item";
  private static readonly ACTIVE_CLASS = "active";
  private static readonly SCROLL_OFFSET = 70;

  /**
   * Initialize the table of contents functionality
   */
  static init(): void {
    document.addEventListener("DOMContentLoaded", () => {
      // Get all headings from the document
      const headings = Array.from(
        document.querySelectorAll<HTMLHeadingElement>(this.HEADING_SELECTOR),
      );
      const tocItems = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(this.TOC_ITEM_SELECTOR),
      );

      if (headings.length === 0 || tocItems.length === 0) return;

      this.initScrollObserver(headings, tocItems);
      this.initSmoothScrolling(tocItems);
    });
  }

  /**
   * Initialize the intersection observer for heading elements
   */
private static initScrollObserver(
     headings: HTMLHeadingElement[],
     tocItems: HTMLAnchorElement[],
  ): IntersectionObserver {
     const observerOptions: IntersectionObserverInit = {
       rootMargin: "-80px 0px -30% 0px",
       threshold: 0,
     };

     const observer = new IntersectionObserver(
       (entries: IntersectionObserverEntry[]) => {
         entries.forEach((entry) => {
           if (entry.isIntersecting) {
             const headingElement = entry.target as HTMLHeadingElement;
             const headingId = headingElement.id;
             const tocItem = tocItems.find(
               (item) => item.getAttribute("href") === `#${headingId}`,
             );

             if (tocItem) {
               // Remove active class from all items
               tocItems.forEach((item) =>
                 item.classList.remove(this.ACTIVE_CLASS),
               );

               // Add active class to current item
               tocItem.classList.add(this.ACTIVE_CLASS);
             }
           }
         });
       },
       observerOptions,
     );

     // Observe each heading
     headings.forEach((heading) => {
       observer.observe(heading);
     });

    return observer;
   }

  /**
   * Initialize smooth scrolling behavior for ToC links
   */
  private static initSmoothScrolling(tocItems: HTMLAnchorElement[]): void {
    tocItems.forEach((link) => {
      link.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (!href) return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - this.SCROLL_OFFSET,
            behavior: "smooth",
          });

          history.pushState(null, "", href);
        }
      });
    });
  }
}

// Initialize table of contents
PostTableOfContents.init();

export default PostTableOfContents;
