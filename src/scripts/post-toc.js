// Highlight active ToC item when scrolling
document.addEventListener("DOMContentLoaded", () => {
  // Get all headings from the document
  const headings = Array.from(
    document.querySelectorAll(".post-content h2, .post-content h3"),
  );
  const tocItems = Array.from(document.querySelectorAll(".toc-item"));

  if (headings.length === 0 || tocItems.length === 0) return;

  // Set up intersection observer
  const observerOptions = {
    rootMargin: "-80px 0px -30% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Find the corresponding TOC item
        const headingId = entry.target.id;
        const tocItem = tocItems.find(
          (item) => item.getAttribute("href") === `#${headingId}`,
        );

        if (tocItem) {
          // Remove active class from all items
          tocItems.forEach((item) => item.classList.remove("active"));

          // Add active class to current item
          tocItem.classList.add("active");
        }
      }
    });
  }, observerOptions);

  // Observe each heading
  headings.forEach((heading) => {
    observer.observe(heading);
  });

  // Add smooth scrolling to TOC links
  tocItems.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (!href) return;

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: "smooth",
        });

        history.pushState(null, "", href);
      }
    });
  });
});
