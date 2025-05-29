/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import PageUtils from "../scripts/page-utils";

describe("PageUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("initFadeElements", () => {
    it("should observe fade-in elements", () => {
      // Create test elements
      const fadeElement = document.createElement("div");
      fadeElement.classList.add("fade-in");
      document.body.appendChild(fadeElement);

      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      const IntersectionObserverMock = vi
        .fn()
        .mockImplementation(() => mockObserver);
      global.IntersectionObserver = IntersectionObserverMock;

      PageUtils.initFadeElements();

      expect(IntersectionObserverMock).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.1 },
      );
      expect(mockObserver.observe).toHaveBeenCalledWith(fadeElement);
    });

    it("should add visible class when element intersects", () => {
      const fadeElement = document.createElement("div");
      fadeElement.classList.add("fade-in");
      document.body.appendChild(fadeElement);

      let observerCallback: IntersectionObserverCallback;
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      const IntersectionObserverMock = vi
        .fn()
        .mockImplementation((callback) => {
          observerCallback = callback;
          return mockObserver;
        });
      global.IntersectionObserver = IntersectionObserverMock;

      PageUtils.initFadeElements();

      // Simulate intersection
      const entries = [
        {
          target: fadeElement,
          isIntersecting: true,
        } as IntersectionObserverEntry,
      ];

      observerCallback!(entries, mockObserver as any);

      expect(fadeElement.classList.contains("visible")).toBe(true);
      expect(mockObserver.unobserve).toHaveBeenCalledWith(fadeElement);
    });

    it("should not observe when no fade elements exist", () => {
      const IntersectionObserverMock = vi.fn();
      global.IntersectionObserver = IntersectionObserverMock;

      PageUtils.initFadeElements();

      expect(IntersectionObserverMock).not.toHaveBeenCalled();
    });
  });

  describe("initSmoothScroll", () => {
    it("should add click listeners to anchor links", () => {
      const anchor = document.createElement("a");
      anchor.href = "#test-section";
      document.body.appendChild(anchor);

      const target = document.createElement("div");
      target.id = "test-section";
      document.body.appendChild(target);

      const scrollIntoViewMock = vi.fn();
      target.scrollIntoView = scrollIntoViewMock;

      PageUtils.initSmoothScroll();

      // Simulate click
      const event = new MouseEvent("click", { bubbles: true });
      anchor.dispatchEvent(event);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
    });

    it("should prevent default behavior on anchor click", () => {
      const anchor = document.createElement("a");
      anchor.href = "#test-section";
      document.body.appendChild(anchor);

      PageUtils.initSmoothScroll();

      const event = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      anchor.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should skip invalid anchor targets", () => {
      const anchor1 = document.createElement("a");
      anchor1.href = "#";
      const anchor2 = document.createElement("a");
      anchor2.href = "#nonexistent";

      document.body.appendChild(anchor1);
      document.body.appendChild(anchor2);

      PageUtils.initSmoothScroll();

      // These should not throw errors
      anchor1.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      anchor2.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(true).toBe(true); // pass if no errors thrown
    });
  });

  describe("initScrollArrow", () => {
    it("should add animate class to scroll arrow", () => {
      const scrollArrow = document.createElement("div");
      scrollArrow.classList.add("scroll-arrow");
      document.body.appendChild(scrollArrow);

      PageUtils.initScrollArrow();

      expect(scrollArrow.classList.contains("animate")).toBe(true);
    });

    it("should handle missing scroll arrow gracefully", () => {
      PageUtils.initScrollArrow();
      // Should not throw error when no scroll arrow exists
      expect(true).toBe(true);
    });
  });

  describe("init", () => {
    it("should initialize all components on DOMContentLoaded", () => {
      const initFadeElementsSpy = vi.spyOn(PageUtils, "initFadeElements");
      const initSmoothScrollSpy = vi.spyOn(PageUtils, "initSmoothScroll");
      const initScrollArrowSpy = vi.spyOn(PageUtils, "initScrollArrow");

      // Simulate DOMContentLoaded event
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(initFadeElementsSpy).toHaveBeenCalled();
      expect(initSmoothScrollSpy).toHaveBeenCalled();
      expect(initScrollArrowSpy).toHaveBeenCalled();
    });
  });
});
