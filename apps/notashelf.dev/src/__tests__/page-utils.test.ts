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

      const IntersectionObserverMock = vi.fn(function (
        this: any,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        return mockObserver;
      });
      global.IntersectionObserver = IntersectionObserverMock as any;

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

      const IntersectionObserverMock = vi.fn(function (
        this: any,
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        observerCallback = callback;
        return mockObserver;
      });
      global.IntersectionObserver = IntersectionObserverMock as any;

      PageUtils.initFadeElements();

      // Simulate intersection
      const entries = [
        {
          target: fadeElement,
          isIntersecting: true,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
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
      const initScrollArrowSpy = vi.spyOn(PageUtils, "initScrollArrow");

      // Call PageUtils.init() to set up the event listener
      PageUtils.init();

      // Simulate DOMContentLoaded event
      const event = new Event("DOMContentLoaded");
      document.dispatchEvent(event);

      expect(initFadeElementsSpy).toHaveBeenCalled();
      expect(initScrollArrowSpy).toHaveBeenCalled();
    });
  });
});
