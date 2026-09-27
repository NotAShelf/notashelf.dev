/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import PageUtils from "../scripts/page-utils";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PageUtils", () => {
  it("reveals intersecting fade elements once, leaving other elements hidden", () => {
    const visible = document.createElement("div");
    visible.className = "fade-in";
    const hidden = document.createElement("div");
    hidden.className = "fade-in";
    document.body.append(visible, hidden);

    const observer = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    let onIntersect: IntersectionObserverCallback | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observer.observe;
        unobserve = observer.unobserve;
        disconnect = observer.disconnect;

        constructor(callback: IntersectionObserverCallback) {
          onIntersect = callback;
        }
      },
    );

    PageUtils.initFadeElements();
    expect(observer.observe).toHaveBeenCalledWith(visible);
    expect(observer.observe).toHaveBeenCalledWith(hidden);
    if (!onIntersect) throw new Error("Missing intersection callback");
    onIntersect(
      [
        { target: visible, isIntersecting: true },
        { target: hidden, isIntersecting: false },
      ] as IntersectionObserverEntry[],
      observer as unknown as IntersectionObserver,
    );
    expect(visible.classList.contains("visible")).toBe(true);
    expect(hidden.classList.contains("visible")).toBe(false);
    expect(observer.unobserve).toHaveBeenCalledWith(visible);
    expect(observer.unobserve).not.toHaveBeenCalledWith(hidden);
  });

  it("activates the scroll arrow after DOMContentLoaded", () => {
    const arrow = document.createElement("div");
    arrow.className = "scroll-arrow";
    document.body.appendChild(arrow);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    PageUtils.init();
    expect(arrow.classList.contains("animate")).toBe(false);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(arrow.classList.contains("animate")).toBe(true);
  });

  it("activates the scroll arrow immediately after DOMContentLoaded", () => {
    const arrow = document.createElement("div");
    arrow.className = "scroll-arrow";
    document.body.appendChild(arrow);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");

    PageUtils.init();
    expect(arrow.classList.contains("animate")).toBe(true);
  });
});
