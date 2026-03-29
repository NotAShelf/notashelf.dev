/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PostEntry } from "@lib/types";

// Mock PostSearchState
const mockPostSearchState = {
  getSearchState: vi.fn(),
  setSearchState: vi.fn(),
  clearSearchState: vi.fn(),
};

vi.mock("../scripts/utils/post-search", () => ({
  PostSearchState: mockPostSearchState,
}));

function buildDOM() {
  document.body.innerHTML = "";

  const form = document.createElement("form");
  form.id = "search-form";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "search-input";
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.id = "clear-search";
  clearBtn.textContent = "Clear";
  form.append(input, clearBtn);

  const resetBtn = document.createElement("button");
  resetBtn.id = "reset-filters";
  resetBtn.textContent = "Reset";

  const allTagBtn = document.createElement("button");
  allTagBtn.className = "tag-filter";
  allTagBtn.dataset.tag = "";
  allTagBtn.textContent = "All";

  const jsTagBtn = document.createElement("button");
  jsTagBtn.className = "tag-filter";
  jsTagBtn.dataset.tag = "javascript";
  jsTagBtn.textContent = "JavaScript";

  const tsTagBtn = document.createElement("button");
  tsTagBtn.className = "tag-filter";
  tsTagBtn.dataset.tag = "typescript";
  tsTagBtn.textContent = "TypeScript";

  const noResults = document.createElement("div");
  noResults.className = "no-results";
  noResults.style.display = "none";

  // post-list (paginated)
  const postList = document.createElement("ul");
  postList.className = "post-list";
  const li1p = document.createElement("li");
  li1p.className = "post-dropdown-item";
  li1p.dataset.postId = "post-1";
  li1p.dataset.keywords = "javascript,testing";
  const t1p = document.createElement("div");
  t1p.className = "post-title";
  t1p.textContent = "JavaScript Testing";
  const d1p = document.createElement("div");
  d1p.className = "post-description";
  d1p.textContent = "Learn about testing in JavaScript";
  li1p.append(t1p, d1p);
  postList.append(li1p);

  // post-list-all
  const postListAll = document.createElement("ul");
  postListAll.className = "post-list-all";
  const li1a = document.createElement("li");
  li1a.className = "post-dropdown-item";
  li1a.dataset.postId = "post-1";
  li1a.dataset.keywords = "javascript,testing";
  const t1a = document.createElement("div");
  t1a.className = "post-title";
  t1a.textContent = "JavaScript Testing";
  const d1a = document.createElement("div");
  d1a.className = "post-description";
  d1a.textContent = "Learn about testing in JavaScript";
  li1a.append(t1a, d1a);
  const li2a = document.createElement("li");
  li2a.className = "post-dropdown-item";
  li2a.dataset.postId = "post-2";
  li2a.dataset.keywords = "typescript,development";
  const t2a = document.createElement("div");
  t2a.className = "post-title";
  t2a.textContent = "TypeScript Guide";
  const d2a = document.createElement("div");
  d2a.className = "post-description";
  d2a.textContent = "TypeScript development guide";
  li2a.append(t2a, d2a);
  postListAll.append(li1a, li2a);

  const pagination = document.createElement("div");
  pagination.id = "pagination-container";
  const paginationLink = document.createElement("a");
  paginationLink.href = "#";
  paginationLink.className = "pagination-link";
  paginationLink.textContent = "Next";
  pagination.append(paginationLink);

  const viewToggle = document.createElement("button");
  viewToggle.id = "view-toggle";
  viewToggle.textContent = "Toggle View";

  const paginationIcon = document.createElement("div");
  paginationIcon.id = "pagination-icon";
  paginationIcon.textContent = "Pagination";

  const allIcon = document.createElement("div");
  allIcon.id = "all-icon";
  allIcon.textContent = "All";

  const viewLabel = document.createElement("div");
  viewLabel.id = "view-label";
  viewLabel.textContent = "View";

  document.body.append(
    form, resetBtn, allTagBtn, jsTagBtn, tsTagBtn,
    noResults, postList, postListAll, pagination,
    viewToggle, paginationIcon, allIcon, viewLabel,
  );
}

describe("post-search-ui", () => {
  let mockPosts: PostEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.clearAllTimers();
    vi.useFakeTimers();

    mockPostSearchState.getSearchState.mockReturnValue({
      searchTerm: "",
      activeTag: "",
      viewAll: false,
    });

    mockPosts = [
      {
        id: "post-1",
        collection: "posts",
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
        collection: "posts",
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

    buildDOM();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("PostSearchUI", () => {
    it("should initialize with posts and setup DOM elements", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      expect(searchUI).toBeDefined();
    });

    it("should initialize successfully with all elements present", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();
      expect(mockPostSearchState.getSearchState).toHaveBeenCalled();
    });

    it("should handle missing search elements gracefully", async () => {
      document.getElementById("search-form")?.remove();
      document.getElementById("search-input")?.remove();

      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await expect(searchUI.init()).resolves.not.toThrow();
    });

    it("should initialize from saved state", async () => {
      mockPostSearchState.getSearchState.mockReturnValue({
        searchTerm: "test query",
        activeTag: "javascript",
        viewAll: true,
      });

      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      expect(searchInput.value).toBe("test query");
    });

    it("should perform search when input is typed", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      searchInput.value = "javascript";
      searchInput.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(300);

      const posts = document.querySelectorAll(".post-dropdown-item");
      expect(posts.length).toBeGreaterThan(0);
    });

    it("should handle search form submission", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchForm = document.getElementById("search-form") as HTMLFormElement;
      const event = new Event("submit");
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      searchForm.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should clear search when clear button is clicked", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      const clearButton = document.getElementById("clear-search") as HTMLButtonElement;
      searchInput.value = "test";
      clearButton.dispatchEvent(new Event("click"));
      expect(searchInput.value).toBe("");
    });

    it("should handle tag selection", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const tagButton = document.querySelector('[data-tag="javascript"]') as HTMLButtonElement;
      tagButton.dispatchEvent(new Event("click"));
      expect(tagButton.classList.contains("active")).toBe(true);
    });

    it("should toggle view mode", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const viewToggle = document.getElementById("view-toggle") as HTMLButtonElement;
      viewToggle.dispatchEvent(new Event("click"));

      const postList = document.querySelector(".post-list") as HTMLElement;
      const postListAll = document.querySelector(".post-list-all") as HTMLElement;
      expect(
        postList.style.display === "none" || postListAll.style.display === "none",
      ).toBe(true);
    });

    it("should reset filters when reset button is clicked", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      const resetButton = document.getElementById("reset-filters") as HTMLButtonElement;
      const tagButton = document.querySelector('[data-tag="javascript"]') as HTMLButtonElement;

      searchInput.value = "test";
      tagButton.classList.add("active");
      resetButton.dispatchEvent(new Event("click"));

      expect(searchInput.value).toBe("");
      expect(tagButton.classList.contains("active")).toBe(false);
    });

    it("should handle pagination link clicks", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const paginationLink = document.querySelector(".pagination-link") as HTMLAnchorElement;
      paginationLink.dispatchEvent(new Event("click"));
      expect(mockPostSearchState.setSearchState).toHaveBeenCalled();
    });

    it("should show no results when no posts match", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      (searchUI as any).isViewingAll = true;
      (searchUI as any).initializeCachedElements();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      searchInput.value = "xyznonexistent";
      (searchUI as any).performSearch();

      const noResults = document.querySelector(".no-results") as HTMLElement;
      expect(noResults.style.display).toBe("block");
    });

    it("should handle missing optional elements gracefully", async () => {
      document.getElementById("view-toggle")?.remove();
      document.getElementById("pagination-icon")?.remove();
      document.getElementById("all-icon")?.remove();
      document.getElementById("view-label")?.remove();

      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await expect(searchUI.init()).resolves.not.toThrow();
    });

    it("should handle search input with debouncing", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      const performSearchSpy = vi.spyOn(searchUI as any, "performSearch");

      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
      vi.advanceTimersByTime(350);
      expect(performSearchSpy).toHaveBeenCalled();
    }, 1000);

    it("should cleanup and re-setup event listeners on second init", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      const originalForm = document.getElementById("search-form");

      await searchUI.init();
      await searchUI.init();

      const newForm = document.getElementById("search-form");
      expect(newForm).not.toBe(originalForm);
    });

    it("should handle performSearch with view all mode", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      (searchUI as any).isViewingAll = true;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      searchInput.value = "test";
      (searchUI as any).performSearch();

      const postList = document.querySelector(".post-list") as HTMLElement;
      const postListAll = document.querySelector(".post-list-all") as HTMLElement;
      expect(postList.style.display).toBe("none");
      expect(postListAll.style.display).toBe("");
    });

    it("should handle posts without title element gracefully", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const extra = document.createElement("li");
      extra.className = "post-dropdown-item";
      extra.dataset.postId = "no-title";
      extra.dataset.keywords = "test";
      const descOnly = document.createElement("div");
      descOnly.className = "post-description";
      descOnly.textContent = "Description only";
      extra.append(descOnly);
      document.querySelector(".post-list-all")?.append(extra);

      (searchUI as any).isViewingAll = true;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      searchInput.value = "test";
      expect(() => (searchUI as any).performSearch()).not.toThrow();
    });

    it("should switch to view all when a tag is selected", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      (searchUI as any).isViewingAll = false;
      const tagButton = document.querySelector('[data-tag="javascript"]') as HTMLButtonElement;
      const updateViewModeSpy = vi.spyOn(searchUI as any, "updateViewMode");

      tagButton.dispatchEvent(new Event("click"));

      expect((searchUI as any).isViewingAll).toBe(true);
      expect(updateViewModeSpy).toHaveBeenCalledWith(true);
    });

    it("should handle tag selection with empty tag (All)", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const allTagButton = document.querySelector('[data-tag=""]') as HTMLButtonElement;
      const performSearchSpy = vi.spyOn(searchUI as any, "performSearch");
      allTagButton.dispatchEvent(new Event("click"));

      expect((searchUI as any).currentActiveTag).toBe("");
      expect(performSearchSpy).toHaveBeenCalled();
    });

    it("should update view icons and label in updateViewMode", async () => {
      const { PostSearchUI } = await import("../scripts/post-search-ui");
      const searchUI = new PostSearchUI(mockPosts);
      await searchUI.init();

      const paginationIcon = document.getElementById("pagination-icon") as HTMLElement;
      const allIcon = document.getElementById("all-icon") as HTMLElement;
      const viewLabel = document.getElementById("view-label") as HTMLElement;

      (searchUI as any).updateViewMode(true);
      expect(paginationIcon.style.display).toBe("none");
      expect(allIcon.style.display).toBe("");
      expect(viewLabel.textContent).toBe("Paginate");

      (searchUI as any).updateViewMode(false);
      expect(paginationIcon.style.display).toBe("");
      expect(allIcon.style.display).toBe("none");
      expect(viewLabel.textContent).toBe("View All");
    });
  });
});
