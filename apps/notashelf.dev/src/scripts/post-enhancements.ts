function getTopRelative(el: Element, ancestor: Element): number {
  const elRect = el.getBoundingClientRect();
  const ancestorRect = ancestor.getBoundingClientRect();
  return elRect.top - ancestorRect.top;
}

function initSidenotes(): void {
  const wrapper = document.querySelector<HTMLElement>(".post-content-wrapper");
  const container = document.querySelector<HTMLElement>(".sidenotes-container");
  const footnotesSection = document.querySelector<HTMLElement>(".footnotes");

  if (!wrapper || !container || !footnotesSection) return;

  const refs = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]"),
  );
  if (!refs.length) return;

  refs.forEach((ref) => {
    const targetId = ref.getAttribute("href")?.slice(1);
    if (!targetId) return;

    const fnLi = document.getElementById(targetId);
    if (!fnLi) return;

    const clone = fnLi.cloneNode(true) as HTMLElement;
    clone.querySelector(".data-footnote-backref")?.remove();

    const num = ref.textContent?.trim() ?? "";
    const aside = document.createElement("aside");
    aside.className = "sidenote";
    aside.innerHTML = `<sup class="sidenote-num">${num}</sup> ${clone.innerHTML.trim()}`;
    aside.style.top = `${getTopRelative(ref, wrapper)}px`;
    container.appendChild(aside);
  });

  // Mirror the CSS breakpoint directly; 1250px matches max-width:1249px boundary.
  const sidenoteActive = window.matchMedia("(min-width: 1250px)").matches;

  if (sidenoteActive) {
    // Transfer ids now that we know sidenotes are shown
    document.querySelectorAll<HTMLElement>(".sidenote").forEach((aside, i) => {
      const ref = refs[i];
      if (!ref) return;
      const targetId = ref.getAttribute("href")?.slice(1);
      if (!targetId) return;
      const fnLi = document.getElementById(targetId); // find li first
      aside.id = targetId;
      fnLi?.removeAttribute("id");
    });

    document
      .querySelectorAll(
        '.toc-item[href="#footnote-label"], .toc-sidebar-item[href="#footnote-label"]',
      )
      .forEach((el) => el.remove());
  }
}

function initBackToTop(): void {
  const btn = document.querySelector<HTMLButtonElement>(".back-to-top");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("visible", window.scrollY > 400);
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initSidebarToc(): void {
  const inlineToc = document.querySelector<HTMLElement>(".toc-container");
  const sidebar = document.querySelector<HTMLElement>(".toc-sidebar");

  if (!inlineToc || !sidebar) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const show = !entry.isIntersecting;
      sidebar.classList.toggle("visible", show);
      sidebar.setAttribute("aria-hidden", String(!show));
    },
    { threshold: 0 },
  );

  observer.observe(inlineToc);
}

function initTitleAnchor(): void {
  const anchor = document.querySelector<HTMLAnchorElement>(".title-anchor");
  if (!anchor) return;

  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url).catch(() => {});
  });
}

window.addEventListener("load", initSidenotes);

document.addEventListener("DOMContentLoaded", () => {
  initBackToTop();
  initSidebarToc();
  initTitleAnchor();
});
