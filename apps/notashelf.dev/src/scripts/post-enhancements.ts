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

  // Only activate on screens wide enough to show sidenotes
  if (window.innerWidth < 1250) return;

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
    aside.id = targetId; // transfer id so #user-content-fn-N scrolls here
    aside.innerHTML = `<sup class="sidenote-num">${num}</sup> ${clone.innerHTML.trim()}`;

    // Remove id from original li so the hash no longer points into the hidden section
    fnLi.removeAttribute("id");

    aside.style.top = `${getTopRelative(ref, wrapper)}px`;
    container.appendChild(aside);
  });

  footnotesSection.style.display = "none";
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
