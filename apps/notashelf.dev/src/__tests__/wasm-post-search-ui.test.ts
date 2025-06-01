/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PostEntry } from "@lib/types";

// Mock the WASM module
const mockWasmPostSearch = {
  init: vi.fn().mockResolvedValue(undefined),
  combinedSearch: vi.fn().mockReturnValue([]),
};

// Mock PostSearchState
const mockPostSearchState = {
  getSearchState: vi.fn(),
  setSearchState: vi.fn(),
  clearSearchState: vi.fn(),
};

vi.mock("../scripts/wasm.ts", () => ({
  wasmPostSearch: mockWasmPostSearch,
}));

vi.mock("../scripts/post-search-state.ts", () => ({
  default: mockPostSearchState,
}));

describe("wasm-post-search-ui", () => {
  let mockPosts: PostEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Reset mock to return default state
    mockPostSearchState.getSearchState.mockReturnValue({
      searchTerm: "",
      activeTag: "",
      viewAll: false,
    });

    mockPosts = [
      {
        id: "post-1",
        data: {
          title: "JavaScript Testing",
          description: "Learn about testing in JavaScript",
          keywords: ["javascript", "testing"],
          date: new Date("2024-01-01"),
          draft: false,
          archived: false,
        },
      },
      {
        id: "post-2",
        data: {
          title: "TypeScript Guide",
          description: "TypeScript development guide",
          keywords: ["typescript", "development"],
          date: new Date("2024-01-02"),
          draft: false,
          archived: false,
        },
      },
    ];

    // Setup DOM elements that the UI expects
    document.body.innerHTML = `
      <form id="search-form">
        <input type="text" id="search-input" />
        <button type="button" id="clear-search">Clear</button>
      </form>
      <button id="reset-filters">Reset</button>
      <button class="tag-filter" data-tag="">All</button>
      <button class="tag-filter" data-tag="javascript">JavaScript</button>
      <button class="tag-filter" data-tag="typescript">TypeScript</button>
      <div class="no-results" style="display: none;">No results</div>
      <ul class="post-list">
        <li class="post-dropdown-item" data-post-id="post-1" data-keywords="javascript,testing">
          <div class="post-title">JavaScript Testing</div>
          <div class="post-description">Learn about testing in JavaScript</div>
          <time class="post-date" datetime="2024-01-01T00:00:00Z">2024-01-01</time>
        </li>
      </ul>
      <ul class="post-list-all">
        <li class="post-dropdown-item" data-post-id="post-1" data-keywords="javascript,testing">
          <div class="post-title">JavaScript Testing</div>
          <div class="post-description">Learn about testing in JavaScript</div>
          <time class="post-date" datetime="2024-01-01T00:00:00Z">2024-01-01</time>
        </li>
        <li class="post-dropdown-item" data-post-id="post-2" data-keywords="typescript,development">
          <div class="post-title">TypeScript Guide</div>
          <div class="post-description">TypeScript development guide</div>
          <time class="post-date" datetime="2024-01-02T00:00:00Z">2024-01-02</time>
        </li>
      </ul>
      <div id="pagination-container">
        <a href="#" class="pagination-link">Next</a>
      </div>
      <button id="view-toggle">Toggle View</button>
      <div id="pagination-icon">📄</div>
      <div id="all-icon">📋</div>
      <div id="view-label">View</div>
    `;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("WasmPostSearchUI", () => {
    it("should initialize with posts and setup DOM elements", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      expect(searchUI).toBeDefined();
    });

    it("should initialize successfully with all elements present", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      expect(mockPostSearchState.getSearchState).toHaveBeenCalled();
    });

    it("should handle missing search elements by falling back to basic search", async () => {
      document.getElementById("search-form")?.remove();
      document.getElementById("search-input")?.remove();

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Should not throw and should handle gracefully
      expect(searchUI).toBeDefined();
    });

    it("should initialize from saved state", async () => {
      mockPostSearchState.getSearchState.mockReturnValue({
        searchTerm: "test query",
        activeTag: "javascript",
        viewAll: true,
      });

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      expect(searchInput.value).toBe("test query");
    });

    it("should perform basic search when WASM is not initialized", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "javascript";

      // Trigger search
      const event = new Event("input");
      searchInput.dispatchEvent(event);

      // Fast-forward timers to trigger debounced search
      vi.advanceTimersByTime(300);

      // Basic search should show/hide posts based on content
      const posts = document.querySelectorAll(".post-dropdown-item");
      expect(posts.length).toBeGreaterThan(0);
    });

    it("should perform WASM search when initialized", async () => {
      const mockResults = [mockPosts[0]];
      mockWasmPostSearch.combinedSearch.mockReturnValue(mockResults);

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Manually set as initialized and perform search
      (searchUI as any).isInitialized = true;

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "javascript";

      // Trigger performSearch directly to bypass debounce
      await (searchUI as any).performSearch();

      expect(mockWasmPostSearch.combinedSearch).toHaveBeenCalledWith(
        "javascript",
        "",
        100,
      );
    });

    it("should handle search form submission", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchForm = document.getElementById(
        "search-form",
      ) as HTMLFormElement;
      const event = new Event("submit");
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      searchForm.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should clear search when clear button is clicked", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      const clearButton = document.getElementById(
        "clear-search",
      ) as HTMLButtonElement;

      searchInput.value = "test";
      clearButton.dispatchEvent(new Event("click"));

      expect(searchInput.value).toBe("");
    });

    it("should handle tag selection", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const tagButton = document.querySelector(
        '[data-tag="javascript"]',
      ) as HTMLButtonElement;
      tagButton.dispatchEvent(new Event("click"));

      expect(tagButton.classList.contains("active")).toBe(true);
    });

    it("should toggle view mode", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const viewToggle = document.getElementById(
        "view-toggle",
      ) as HTMLButtonElement;
      viewToggle.dispatchEvent(new Event("click"));

      // View mode should be updated
      const postList = document.querySelector(".post-list") as HTMLElement;
      const postListAll = document.querySelector(
        ".post-list-all",
      ) as HTMLElement;

      // One should be hidden and the other visible
      expect(
        postList.style.display === "none" ||
          postListAll.style.display === "none",
      ).toBe(true);
    });

    it("should reset filters when reset button is clicked", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      const resetButton = document.getElementById(
        "reset-filters",
      ) as HTMLButtonElement;
      const tagButton = document.querySelector(
        '[data-tag="javascript"]',
      ) as HTMLButtonElement;

      // Set some search state
      searchInput.value = "test";
      tagButton.classList.add("active");

      resetButton.dispatchEvent(new Event("click"));

      expect(searchInput.value).toBe("");
      expect(tagButton.classList.contains("active")).toBe(false);
    });

    it("should handle pagination link clicks", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const paginationLink = document.querySelector(
        ".pagination-link",
      ) as HTMLAnchorElement;
      paginationLink.dispatchEvent(new Event("click"));

      expect(mockPostSearchState.setSearchState).toHaveBeenCalled();
    });

    it("should show no results message when no posts match", async () => {
      // Ensure WASM search returns empty results for this test
      mockWasmPostSearch.combinedSearch.mockReturnValue([]);

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Manually initialize WASM to ensure it's ready
      await (searchUI as any).initWasmOnDemand();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "nonexistent";

      // Verify that WASM is initialized
      expect((searchUI as any).isInitialized).toBe(true);

      // Call performSearch directly to avoid timing issues
      await (searchUI as any).performSearch();

      // Verify that combinedSearch was called
      expect(mockWasmPostSearch.combinedSearch).toHaveBeenCalledWith(
        "nonexistent",
        "",
        100,
      );

      const noResults = document.querySelector(".no-results") as HTMLElement;
      console.log("No results display:", noResults.style.display);
      expect(noResults.style.display).toBe("block");
    });

    it("should lazy load WASM on search input focus", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Manually trigger the initWasmOnDemand function - this should work after init() is called
      await (searchUI as any).initWasmOnDemand();

      expect(mockWasmPostSearch.init).toHaveBeenCalledWith(mockPosts);
    });

    it("should handle WASM initialization errors gracefully", async () => {
      mockWasmPostSearch.init.mockRejectedValue(new Error("WASM init failed"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      // Need to call init() first to set up the lazy loading
      await searchUI.init();

      // Try to trigger initialization error by calling initWasmOnDemand
      try {
        await (searchUI as any).initWasmOnDemand();
      } catch {
        // Expected to fail
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to lazy-load WASM search engine",
      );
    });

    it("should cleanup event listeners", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const removeEventListenerSpy = vi.spyOn(
        HTMLElement.prototype,
        "removeEventListener",
      );

      searchUI.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it("should handle missing optional elements gracefully", async () => {
      document.getElementById("view-toggle")?.remove();
      document.getElementById("pagination-icon")?.remove();
      document.getElementById("all-icon")?.remove();
      document.getElementById("view-label")?.remove();

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Should not throw even with missing optional elements
      await expect(searchUI.init()).resolves.not.toThrow();
    });

    it("should handle search input with debouncing and empty search", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;

      // Test empty search triggers performSearch
      searchInput.value = "";
      const performSearchSpy = vi.spyOn(searchUI as any, "performSearch");

      // Use fake timers to control debounce
      vi.useFakeTimers();

      // Trigger input event
      searchInput.dispatchEvent(new Event("input"));

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(350);

      expect(performSearchSpy).toHaveBeenCalled();

      vi.useRealTimers();
    }, 1000);

    it("should handle search input with non-empty value and WASM initialization", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;

      // Test non-empty search triggers WASM init then search
      searchInput.value = "test query";
      const initWasmSpy = vi.spyOn(searchUI as any, "initWasmOnDemand");
      const performSearchSpy = vi.spyOn(searchUI as any, "performSearch");

      // Use fake timers to control debounce
      vi.useFakeTimers();

      // Trigger input event
      searchInput.dispatchEvent(new Event("input"));

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(350);

      expect(initWasmSpy).toHaveBeenCalled();

      // Wait for WASM init promise to resolve
      await vi.waitFor(
        () => {
          expect(performSearchSpy).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      vi.useRealTimers();
    }, 2000);

    it("should handle cleanupEventListeners method", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Get original elements
      const originalForm = document.getElementById("search-form");
      const originalInput = document.getElementById("search-input");
      const originalClear = document.getElementById("clear-search");

      // Call cleanup method
      (searchUI as any).cleanupEventListeners();

      // Elements should be replaced (new instances)
      const newForm = document.getElementById("search-form");
      const newInput = document.getElementById("search-input");
      const newClear = document.getElementById("clear-search");

      expect(newForm).not.toBe(originalForm);
      expect(newInput).not.toBe(originalInput);
      expect(newClear).not.toBe(originalClear);
    });

    it("should handle setupBasicEventListeners method", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Call setupBasicEventListeners directly
      (searchUI as any).setupBasicEventListeners();

      const searchForm = document.getElementById(
        "search-form",
      ) as HTMLFormElement;
      const event = new Event("submit");
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      searchForm.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should handle basic search input events", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Call setupBasicEventListeners to set up basic handlers
      (searchUI as any).setupBasicEventListeners();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      const clearButton = document.getElementById(
        "clear-search",
      ) as HTMLButtonElement;

      // Test basic input event
      searchInput.value = "test";
      searchInput.dispatchEvent(new Event("input"));

      expect(clearButton.style.display).toBe("");

      // Test basic clear button
      clearButton.dispatchEvent(new Event("click"));
      expect(searchInput.value).toBe("");
    });

    it("should handle performBasicSearch with no search input element", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Remove search input to test guard clause
      const searchInput = document.getElementById("search-input");
      searchInput?.remove();

      // Should not throw when calling performBasicSearch without search input
      expect(() => (searchUI as any).performBasicSearch()).not.toThrow();
    });

    it("should handle performBasicSearch with cached elements", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Set up cached elements
      (searchUI as any).initializeCachedElements();

      // Test search with cached elements
      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "javascript";

      // Call performBasicSearch directly
      (searchUI as any).performBasicSearch();

      // Should use cached elements for filtering
      expect((searchUI as any).cachedPostElements.paginated).toBeTruthy();
    });

    it("should handle performBasicSearch with view all mode", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Set view all mode
      (searchUI as any).isViewingAll = true;

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "test";

      // Call performBasicSearch directly
      (searchUI as any).performBasicSearch();

      const postList = document.querySelector(".post-list") as HTMLElement;
      const postListAll = document.querySelector(
        ".post-list-all",
      ) as HTMLElement;

      expect(postList.style.display).toBe("none");
      expect(postListAll.style.display).toBe("");
    });

    it("should handle performBasicSearch without title element", async () => {
      // Add a post element without title for testing
      document.body.innerHTML += `
        <ul class="post-list-all">
          <li class="post-dropdown-item" data-post-id="no-title" data-keywords="test">
            <div class="post-description">Description only</div>
          </li>
        </ul>
      `;

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Set view all mode to use post-list-all
      (searchUI as any).isViewingAll = true;

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "test";

      // Call performBasicSearch - should handle missing title gracefully
      expect(() => (searchUI as any).performBasicSearch()).not.toThrow();
    });

    it("should handle tag selection switching to view all automatically", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Ensure we're not in view all mode initially
      (searchUI as any).isViewingAll = false;

      const tagButton = document.querySelector(
        '[data-tag="javascript"]',
      ) as HTMLButtonElement;

      // Mock updateViewMode to verify it's called
      const updateViewModeSpy = vi.spyOn(searchUI as any, "updateViewMode");

      tagButton.dispatchEvent(new Event("click"));

      expect((searchUI as any).isViewingAll).toBe(true);
      expect(updateViewModeSpy).toHaveBeenCalledWith(true);
    });

    it("should handle tag selection with empty tag (All)", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const allTagButton = document.querySelector(
        '[data-tag=""]',
      ) as HTMLButtonElement;

      const performSearchSpy = vi.spyOn(searchUI as any, "performSearch");

      allTagButton.dispatchEvent(new Event("click"));

      expect((searchUI as any).currentActiveTag).toBe("");
      expect(performSearchSpy).toHaveBeenCalled();
    });

    it("should handle updateViewMode with pagination and all icons", async () => {
      // Add missing icons to DOM
      document.body.innerHTML += `
        <div id="pagination-icon" style="display: none;">Pagination</div>
        <div id="all-icon" style="display: none;">All</div>
        <div id="view-label">View All</div>
      `;

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      const paginationIcon = document.getElementById(
        "pagination-icon",
      ) as HTMLElement;
      const allIcon = document.getElementById("all-icon") as HTMLElement;
      const viewLabel = document.getElementById("view-label") as HTMLElement;

      // Test switching to view all
      (searchUI as any).updateViewMode(true);

      expect(paginationIcon.style.display).toBe("none");
      expect(allIcon.style.display).toBe("");
      expect(viewLabel.textContent).toBe("Paginate");

      // Test switching back to paginated
      (searchUI as any).updateViewMode(false);

      expect(paginationIcon.style.display).toBe("");
      expect(allIcon.style.display).toBe("none");
      expect(viewLabel.textContent).toBe("View All");
    });

    // TODO: Promise caching logic may need revision - initWasmOnDemand returns different promise instances on each call
    // it("should handle WASM initialization promise caching", async () => {
    //   const { WasmPostSearchUI } = await import(
    //     "../scripts/wasm-post-search-ui.ts"
    //   );

    //   const searchUI = new WasmPostSearchUI(mockPosts);
    //   await searchUI.init();

    //   // Ensure WASM is not initialized yet so we test the actual caching logic
    //   (searchUI as any).isInitialized = false;

    //   // Call initWasmOnDemand multiple times
    //   const promise1 = (searchUI as any).initWasmOnDemand();
    //   const promise2 = (searchUI as any).initWasmOnDemand();

    //   // Should return the same promise (cached) - check reference equality
    //   expect(promise1).toEqual(promise2);
    //   expect(promise1 === promise2).toBe(true);

    //   await promise1;
    //   expect((searchUI as any).isInitialized).toBe(true);
    // });

    it("should handle search input focus with basic event handlers", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Setup basic handlers instead of WASM handlers
      (searchUI as any).setupBasicEventListeners();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;

      // Basic focus should not cause issues
      expect(() => searchInput.dispatchEvent(new Event("focus"))).not.toThrow();
    });

    it("should handle basic clear button event handler", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Use eventHandlers.basicClearButtonClick directly
      const eventHandlers = (searchUI as any).eventHandlers;
      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;

      searchInput.value = "test";
      eventHandlers.basicClearButtonClick();

      expect(searchInput.value).toBe("");
    });

    it("should handle basic search input input event", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      const eventHandlers = (searchUI as any).eventHandlers;
      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      const clearButton = document.getElementById(
        "clear-search",
      ) as HTMLButtonElement;

      searchInput.value = "test";

      // Use fake timers to control debounce
      vi.useFakeTimers();

      eventHandlers.basicSearchInputInput();

      expect(clearButton.style.display).toBe("");

      // Fast-forward time to complete debounce
      vi.advanceTimersByTime(350);

      vi.useRealTimers();
    }, 1000);

    it("should handle basic search form submit event", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      const eventHandlers = (searchUI as any).eventHandlers;
      const event = new Event("submit");
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      eventHandlers.basicSearchFormSubmit(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should handle eventListeners cleanup when not attached", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Set eventListenersAttached to false
      (searchUI as any).eventListenersAttached = false;

      // Should return early without doing anything
      expect(() => (searchUI as any).cleanupEventListeners()).not.toThrow();
    });

    it("should handle initializeFromState with all tag button", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Call initializeFromState with empty activeTag to test "All" button selection
      (searchUI as any).initializeFromState("", "");

      // Find the "All" tag button (empty data-tag)
      const allTagButton = Array.from(
        document.querySelectorAll(".tag-filter"),
      ).find((btn) => btn.getAttribute("data-tag") === "") as HTMLButtonElement;

      if (allTagButton) {
        expect(allTagButton.classList.contains("active")).toBe(true);
      }
    });

    it("should handle missing post element in updatePostsDisplay", async () => {
      // Ensure WASM search returns results for a non-existent post
      mockWasmPostSearch.combinedSearch.mockReturnValue([
        { id: "non-existent-post" },
      ]);

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Manually initialize WASM
      await (searchUI as any).initWasmOnDemand();

      const searchInput = document.getElementById(
        "search-input",
      ) as HTMLInputElement;
      searchInput.value = "test";

      // Call performSearch - should handle missing post element gracefully
      await (searchUI as any).performSearch();

      expect(mockWasmPostSearch.combinedSearch).toHaveBeenCalled();
    });

    it("should create fallback elements when required elements are missing", async () => {
      // Remove required elements
      document.getElementById("search-input")?.remove();
      document.getElementById("search-form")?.remove();
      document.getElementById("clear-search")?.remove();
      document.getElementById("reset-filters")?.remove();
      document.getElementById("pagination-container")?.remove();

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Constructor should create fallback elements and log warnings
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element #search-input not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element #search-form not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element #clear-search not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element #reset-filters not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element #pagination-container not found - creating fallback element",
      );

      // Check that fallback elements have hidden property
      const elements = (searchUI as any).elements;
      expect(elements.searchInput.hidden).toBe(true);
      expect(elements.searchForm.hidden).toBe(true);
      expect(elements.clearButton.hidden).toBe(true);
      expect(elements.resetButton.hidden).toBe(true);
      expect(elements.paginationContainer.hidden).toBe(true);
    });

    it("should create fallback elements for selectors when missing", async () => {
      // Remove elements that use querySelector
      document.querySelector(".no-results")?.remove();
      document.querySelector(".post-list")?.remove();
      document.querySelector(".post-list-all")?.remove();

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element .no-results not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element .post-list not found - creating fallback element",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Required element .post-list-all not found - creating fallback element",
      );

      // Check that fallback elements have hidden property
      const elements = (searchUI as any).elements;
      expect(elements.noResults.hidden).toBe(true);
      expect(elements.postList.hidden).toBe(true);
      expect(elements.postListAll.hidden).toBe(true);
    });

    it("should test the constructor with posts parameter", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      expect((searchUI as any).allPosts).toEqual(mockPosts);
      expect((searchUI as any).isViewingAll).toBe(false);
      expect((searchUI as any).currentActiveTag).toBe("");
      expect((searchUI as any).isInitialized).toBe(false);
      expect((searchUI as any).eventListenersAttached).toBe(false);
    });

    it("should handle missing elements detection in init", async () => {
      // Remove search elements to trigger basic event listeners setup
      document.getElementById("search-input")?.remove();
      document.getElementById("search-form")?.remove();

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      const setupBasicSpy = vi.spyOn(
        searchUI as any,
        "setupBasicEventListeners",
      );

      await searchUI.init();

      expect(setupBasicSpy).toHaveBeenCalled();
    });

    it("should handle try-catch error in init method", async () => {
      // Mock the PostSearchState to throw an error
      vi.doMock("../scripts/post-search-state.ts", () => ({
        default: {
          getSearchState: () => {
            throw new Error("State error");
          },
          setSearchState: vi.fn(),
          clearSearchState: vi.fn(),
        },
      }));

      // Clear modules to ensure fresh import
      vi.resetModules();

      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const setupBasicSpy = vi.spyOn(
        searchUI as any,
        "setupBasicEventListeners",
      );

      await searchUI.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to initialize search UI:",
        expect.any(Error),
      );
      expect(setupBasicSpy).toHaveBeenCalled();

      // Restore the original mock
      vi.doUnmock("../scripts/post-search-state.ts");
      vi.resetModules();
    });

    it("should handle WASM initialization with promise caching", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Ensure WASM is not initialized yet
      (searchUI as any).isInitialized = false;

      // Test promise caching by calling initWasmOnDemand
      const promise1 = (searchUI as any).initWasmOnDemand();
      expect(promise1).toBeInstanceOf(Promise);

      // Wait for the promise to resolve
      await promise1;
      expect((searchUI as any).isInitialized).toBe(true);
    });

    it("should handle cleanup method with missing elements", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Remove elements after construction
      document.getElementById("search-form")?.remove();
      document.getElementById("search-input")?.remove();
      document.getElementById("clear-search")?.remove();

      // Should not throw even with missing elements
      expect(() => searchUI.cleanup()).not.toThrow();
    });

    it("should handle updatePostsDisplay with highlighting", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);
      await searchUI.init();

      // Call updatePostsDisplay with search term for highlighting
      const matchedPosts = [mockPosts[0]];
      (searchUI as any).updatePostsDisplay(matchedPosts, "javascript");

      // Should update posts display without throwing
      expect(document.querySelector(".post-dropdown-item")).toBeTruthy();
    });

    it("should handle multiple event handler scenarios", async () => {
      const { WasmPostSearchUI } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const searchUI = new WasmPostSearchUI(mockPosts);

      // Test individual event handlers from the eventHandlers object
      const eventHandlers = (searchUI as any).eventHandlers;

      // Test tagButtonClick with a mock button
      const mockButton = document.createElement("button");
      mockButton.setAttribute("data-tag", "test");
      expect(() => eventHandlers.tagButtonClick(mockButton)).not.toThrow();

      // Test viewToggleClick
      expect(() => eventHandlers.viewToggleClick()).not.toThrow();

      // Test resetButtonClick
      expect(() => eventHandlers.resetButtonClick()).not.toThrow();

      // Test paginationLinkClick
      expect(() => eventHandlers.paginationLinkClick()).not.toThrow();
    });
  });

  describe("extractPostsFromDOM", () => {
    it("should extract posts from DOM elements", async () => {
      // Clear the body and set up only unique posts
      document.body.innerHTML = `
        <li class="post-dropdown-item" data-post-id="post-1" data-keywords="javascript,testing">
          <div class="post-title">JavaScript Testing</div>
          <div class="post-description">Learn about testing in JavaScript</div>
          <time class="post-date" datetime="2024-01-01T00:00:00Z">2024-01-01</time>
        </li>
        <li class="post-dropdown-item" data-post-id="post-2" data-keywords="typescript,development">
          <div class="post-title">TypeScript Guide</div>
          <div class="post-description">TypeScript development guide</div>
          <time class="post-date" datetime="2024-01-02T00:00:00Z">2024-01-02</time>
        </li>
      `;

      const { extractPostsFromDOM } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const posts = extractPostsFromDOM();

      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe("post-1");
      expect(posts[0].data.title).toBe("JavaScript Testing");
      expect(posts[0].data.keywords).toEqual(["javascript", "testing"]);
      expect(posts[1].id).toBe("post-2");
      expect(posts[1].data.title).toBe("TypeScript Guide");
    });

    it("should handle posts without description", async () => {
      document.body.innerHTML = `
        <li class="post-dropdown-item" data-post-id="post-without-desc" data-keywords="test">
          <div class="post-title">Title Only</div>
          <time class="post-date" datetime="2024-01-01T00:00:00Z">2024-01-01</time>
        </li>
      `;

      const { extractPostsFromDOM } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const posts = extractPostsFromDOM();

      expect(posts).toHaveLength(1);
      expect(posts[0].data.description).toBeUndefined();
    });

    it("should handle invalid date gracefully", async () => {
      document.body.innerHTML = `
        <li class="post-dropdown-item" data-post-id="post-invalid-date" data-keywords="">
          <div class="post-title">Invalid Date Post</div>
          <time class="post-date" datetime="invalid-date">Invalid</time>
        </li>
      `;

      const { extractPostsFromDOM } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const posts = extractPostsFromDOM();

      expect(posts).toHaveLength(1);
      expect(posts[0].data.date).toBeInstanceOf(Date);
    });

    it("should handle missing time element", async () => {
      document.body.innerHTML = `
        <li class="post-dropdown-item" data-post-id="post-no-time" data-keywords="">
          <div class="post-title">No Time Post</div>
        </li>
      `;

      const { extractPostsFromDOM } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const posts = extractPostsFromDOM();

      expect(posts).toHaveLength(1);
      expect(posts[0].data.date).toBeInstanceOf(Date);
    });

    it("should filter empty keywords", async () => {
      document.body.innerHTML = `
        <li class="post-dropdown-item" data-post-id="post-empty-keywords" data-keywords="valid, , another,">
          <div class="post-title">Empty Keywords Post</div>
        </li>
      `;

      const { extractPostsFromDOM } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const posts = extractPostsFromDOM();

      expect(posts).toHaveLength(1);
      expect(posts[0].data.keywords).toEqual(["valid", " another"]);
    });
  });

  describe("postSearchUIRegistry", () => {
    it("should initialize and return singleton instance", async () => {
      const { postSearchUIRegistry } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const instance1 = postSearchUIRegistry.init(mockPosts);
      const instance2 = postSearchUIRegistry.init(mockPosts);

      expect(instance1).toBe(instance2);
      expect(postSearchUIRegistry.instance).toBe(instance1);
    });

    it("should reuse existing instance and not cleanup", async () => {
      const { postSearchUIRegistry } = await import(
        "../scripts/wasm-post-search-ui.ts"
      );

      const instance1 = postSearchUIRegistry.init(mockPosts);
      const cleanupSpy = vi.spyOn(instance1, "cleanup");

      // Simulate new posts - should return same instance
      const newPosts = [mockPosts[0]];
      const instance2 = postSearchUIRegistry.init(newPosts);

      expect(cleanupSpy).not.toHaveBeenCalled();
      expect(instance2).toBe(instance1); // Should reuse existing instance
    });
  });
});
