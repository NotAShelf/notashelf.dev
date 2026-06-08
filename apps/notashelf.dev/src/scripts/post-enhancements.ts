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

  const placed: HTMLElement[] = [];

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
    placed.push(aside);
  });

  // Prevent vertical overlap: when two refs sit close together in the prose,
  // their sidenotes share an almost-identical `top` and stack on each other.
  // Walk in DOM order and push each sidenote down past the previous one's
  // bottom edge if needed.
  const gap = 12;
  for (let i = 1; i < placed.length; i++) {
    const prev = placed[i - 1];
    const curr = placed[i];
    const prevTop = parseFloat(prev.style.top) || 0;
    const prevBottom = prevTop + prev.offsetHeight + gap;
    const currTop = parseFloat(curr.style.top) || 0;
    if (currTop < prevBottom) {
      curr.style.top = `${prevBottom}px`;
    }
  }

  footnotesSection.style.display = "none";
}

async function initMermaid(): Promise<void> {
  const blocks = document.querySelectorAll<HTMLElement>("pre.mermaid");
  if (!blocks.length) return;

  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "dark",
    fontFamily: "inherit",
  });

  try {
    await mermaid.run({ nodes: Array.from(blocks) });
  } catch (err) {
    // Don't blow up the rest of the page if a single diagram is malformed.
    console.error("mermaid render failed", err);
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

window.addEventListener("load", () => {
  // Render mermaid diagrams first so sidenote anchors land on the final
  // post-reflow positions, not the pre-render ones.
  void initMermaid().finally(initSidenotes);
});

document.addEventListener("DOMContentLoaded", () => {
  initBackToTop();
  initSidebarToc();
  initTitleAnchor();
});
