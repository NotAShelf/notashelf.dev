/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import PostTableOfContents from "../scripts/post-toc";

describe("PostTableOfContents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";

    // Mock window.scrollTo
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });

    // Mock history.pushState
    Object.defineProperty(window, "history", {
      value: {
        pushState: vi.fn(),
      },
      writable: true,
    });
  });

  describe("init", () => {
    it("should initialize when headings and toc items exist", () => {
      // Create test DOM structure
      const postContent = document.createElement("div");
      postContent.classList.add("post-content");

      const heading1 = document.createElement("h2");
      heading1.id = "heading-1";
      heading1.textContent = "Heading 1";
      postContent.appendChild(heading1);

      const heading2 = document.createElement("h3");
      heading2.id = "heading-2";
      heading2.textContent = "Heading 2";
      postContent.appendChild(heading2);

      const tocItem1 = document.createElement("a");
      tocItem1.classList.add("toc-item");
      tocItem1.href = "#heading-1";
      tocItem1.textContent = "Heading 1";

      const tocItem2 = document.createElement("a");
      tocItem2.classList.add("toc-item");
      tocItem2.href = "#heading-2";
      tocItem2.textContent = "Heading 2";

      document.body.appendChild(postContent);
      document.body.appendChild(tocItem1);
      document.body.appendChild(tocItem2);

      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      const IntersectionObserverMock = vi.fn(function (
        this: any,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        return mockObserver;
      });
      global.IntersectionObserver = IntersectionObserverMock as any;

      const initScrollObserverSpy = vi.spyOn(
        PostTableOfContents as any,
        "initScrollObserver",
      );
      const initSmoothScrollingSpy = vi.spyOn(
        PostTableOfContents as any,
        "initSmoothScrolling",
      );

      // Simulate DOMContentLoaded
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(initScrollObserverSpy).toHaveBeenCalled();
      expect(initSmoothScrollingSpy).toHaveBeenCalled();
    });

    it("should not initialize when no headings exist", () => {
      const tocItem = document.createElement("a");
      tocItem.classList.add("toc-item");
      tocItem.href = "#heading-1";
      document.body.appendChild(tocItem);

      const initScrollObserverSpy = vi.spyOn(
        PostTableOfContents as any,
        "initScrollObserver",
      );
      const initSmoothScrollingSpy = vi.spyOn(
        PostTableOfContents as any,
        "initSmoothScrolling",
      );

      // Simulate DOMContentLoaded
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(initScrollObserverSpy).not.toHaveBeenCalled();
      expect(initSmoothScrollingSpy).not.toHaveBeenCalled();
    });

    it("should not initialize when no toc items exist", () => {
      const postContent = document.createElement("div");
      postContent.classList.add("post-content");

      const heading = document.createElement("h2");
      heading.id = "heading-1";
      postContent.appendChild(heading);
      document.body.appendChild(postContent);

      const initScrollObserverSpy = vi.spyOn(
        PostTableOfContents as any,
        "initScrollObserver",
      );
      const initSmoothScrollingSpy = vi.spyOn(
        PostTableOfContents as any,
        "initSmoothScrolling",
      );

      // Simulate DOMContentLoaded
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(initScrollObserverSpy).not.toHaveBeenCalled();
      expect(initSmoothScrollingSpy).not.toHaveBeenCalled();
    });
  });

  describe("initScrollObserver", () => {
    it("should create intersection observer with correct options", () => {
      const postContent = document.createElement("div");
      postContent.classList.add("post-content");

      const heading = document.createElement("h2");
      heading.id = "heading-1";
      postContent.appendChild(heading);

      const tocItem = document.createElement("a");
      tocItem.classList.add("toc-item");
      tocItem.href = "#heading-1";

      document.body.appendChild(postContent);
      document.body.appendChild(tocItem);

      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      const IntersectionObserverMock = vi.fn(function (
        this: any,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        return mockObserver;
      });
      global.IntersectionObserver = IntersectionObserverMock as any;

      // Simulate DOMContentLoaded
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(IntersectionObserverMock).toHaveBeenCalledWith(
        expect.any(Function),
        {
          rootMargin: "-80px 0px -30% 0px",
          threshold: 0,
        },
      );
      expect(mockObserver.observe).toHaveBeenCalledWith(heading);
    });

    it("should update active toc item when heading intersects", () => {
      const postContent = document.createElement("div");
      postContent.classList.add("post-content");

      const heading1 = document.createElement("h2");
      heading1.id = "heading-1";
      postContent.appendChild(heading1);

      const heading2 = document.createElement("h2");
      heading2.id = "heading-2";
      postContent.appendChild(heading2);

      const tocItem1 = document.createElement("a");
      tocItem1.classList.add("toc-item");
      tocItem1.href = "#heading-1";

      const tocItem2 = document.createElement("a");
      tocItem2.classList.add("toc-item");
      tocItem2.href = "#heading-2";
      tocItem2.classList.add("active"); // should be initially active

      document.body.appendChild(postContent);
      document.body.appendChild(tocItem1);
      document.body.appendChild(tocItem2);

      let observerCallback: IntersectionObserverCallback;
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      const IntersectionObserverMock = vi.fn(function (
        this: any,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        observerCallback = callback;
        return mockObserver;
      });
      global.IntersectionObserver = IntersectionObserverMock as any;

      // Simulate DOMContentLoaded
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      // Simulate intersection with heading1
      const mockRect = {
        bottom: 100,
        height: 50,
        left: 0,
        right: 100,
        top: 50,
        width: 100,
        x: 0,
        y: 50,
        toJSON: () => ({}),
      } as DOMRectReadOnly;

      const entries = [
        {
          target: heading1,
          isIntersecting: true,
          boundingClientRect: mockRect,
          intersectionRatio: 1.0,
          intersectionRect: mockRect,
          rootBounds: mockRect,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ];

      observerCallback!(entries, mockObserver as any);

      expect(tocItem1.classList.contains("active")).toBe(true);
      expect(tocItem2.classList.contains("active")).toBe(false);
    });
  });

  describe("initSmoothScrolling", () => {
    it("should add click listeners to toc items", () => {
      const targetElement = document.createElement("div");
      targetElement.id = "heading-1";
      // Mock offsetTop property
      Object.defineProperty(targetElement, "offsetTop", {
        value: 200,
        configurable: true,
      });
      document.body.appendChild(targetElement);

      const tocItem = document.createElement("a");
      tocItem.classList.add("toc-item");
      tocItem.href = "#heading-1";
      document.body.appendChild(tocItem);

      const scrollToSpy = vi.spyOn(window, "scrollTo");
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      // Call initSmoothScrolling directly with the toc items
      const tocItems = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(".toc-item"),
      );
      (PostTableOfContents as any).initSmoothScrolling(tocItems);

      // Simulate click
      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

      tocItem.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 130, // 200 - 70 (SCROLL_OFFSET)
        behavior: "smooth",
      });
      expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#heading-1");
    });

    it("should handle missing target element gracefully", () => {
      const tocItem = document.createElement("a");
      tocItem.classList.add("toc-item");
      tocItem.href = "#nonexistent";
      document.body.appendChild(tocItem);

      const scrollToSpy = vi.spyOn(window, "scrollTo");

      // Call initSmoothScrolling directly with the toc items
      const tocItems = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(".toc-item"),
      );
      (PostTableOfContents as any).initSmoothScrolling(tocItems);

      // Simulate click
      const clickEvent = new MouseEvent("click", { bubbles: true });
      tocItem.dispatchEvent(clickEvent);

      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it("should handle toc items without href", () => {
      const tocItem = document.createElement("a");
      tocItem.classList.add("toc-item");
      // No href attribute
      document.body.appendChild(tocItem);

      const scrollToSpy = vi.spyOn(window, "scrollTo");

      // Call initSmoothScrolling directly with the toc items
      const tocItems = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(".toc-item"),
      );
      (PostTableOfContents as any).initSmoothScrolling(tocItems);

      // Simulate click
      const clickEvent = new MouseEvent("click", { bubbles: true });
      tocItem.dispatchEvent(clickEvent);

      expect(scrollToSpy).not.toHaveBeenCalled();
    });
  });
});
