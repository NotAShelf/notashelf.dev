import { wasmPostSearch } from "./wasm-search";
import PostSearchState from "./post-search-state";
import type { PostEntry } from "@lib/types";

interface DOMElements {
  searchInput: HTMLInputElement;
  searchForm: HTMLFormElement;
  clearButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  tagButtons: NodeListOf<HTMLButtonElement>;
  noResults: HTMLDivElement;
  postList: HTMLUListElement;
  postListAll: HTMLUListElement;
  paginationContainer: HTMLDivElement;
  viewToggle: HTMLButtonElement | null;
  paginationIcon: HTMLElement | null;
  allIcon: HTMLElement | null;
  viewLabel: HTMLElement | null;
}

export class WasmPostSearchUI {
  private elements: DOMElements;
  private allPosts: PostEntry[] = [];
  private isViewingAll = false;
  private currentActiveTag = "";
  private isInitialized = false;

  constructor(allPosts: PostEntry[]) {
    this.allPosts = allPosts;
    this.elements = this.getDOMElements();
  }

  private getDOMElements(): DOMElements {
    // Core search elements (required)
    const searchInput = document.getElementById(
      "search-input",
    ) as HTMLInputElement;
    if (!searchInput) {
      throw new Error("Required element #search-input not found");
    }

    const searchForm = document.getElementById(
      "search-form",
    ) as HTMLFormElement;
    if (!searchForm) {
      throw new Error("Required element #search-form not found");
    }

    const clearButton = document.getElementById(
      "clear-search",
    ) as HTMLButtonElement;
    if (!clearButton) {
      throw new Error("Required element #clear-search not found");
    }

    const resetButton = document.getElementById(
      "reset-filters",
    ) as HTMLButtonElement;
    if (!resetButton) {
      throw new Error("Required element #reset-filters not found");
    }

    const tagButtons = document.querySelectorAll(
      ".tag-filter",
    ) as NodeListOf<HTMLButtonElement>;
    if (tagButtons.length === 0) {
      console.warn(
        "No .tag-filter elements found - tag filtering will be disabled",
      );
    }

    const noResults = document.querySelector(".no-results") as HTMLDivElement;
    if (!noResults) {
      throw new Error("Required element .no-results not found");
    }

    const postList = document.querySelector(".post-list") as HTMLUListElement;
    if (!postList) {
      throw new Error("Required element .post-list not found");
    }

    const postListAll = document.querySelector(
      ".post-list-all",
    ) as HTMLUListElement;
    if (!postListAll) {
      throw new Error("Required element .post-list-all not found");
    }

    const paginationContainer = document.getElementById(
      "pagination-container",
    ) as HTMLDivElement;
    if (!paginationContainer) {
      throw new Error("Required element #pagination-container not found");
    }

    // Optional view toggle elements (graceful degradation)
    const viewToggle = document.getElementById(
      "view-toggle",
    ) as HTMLButtonElement;
    if (!viewToggle) {
      console.warn(
        "Optional element #view-toggle not found - view toggle will be disabled",
      );
    }

    const paginationIcon = document.getElementById(
      "pagination-icon",
    ) as HTMLElement;
    if (!paginationIcon) {
      console.warn(
        "Optional element #pagination-icon not found - icon switching will be disabled",
      );
    }

    const allIcon = document.getElementById("all-icon") as HTMLElement;
    if (!allIcon) {
      console.warn(
        "Optional element #all-icon not found - icon switching will be disabled",
      );
    }

    const viewLabel = document.getElementById("view-label") as HTMLElement;
    if (!viewLabel) {
      console.warn(
        "Optional element #view-label not found - label switching will be disabled",
      );
    }

    return {
      searchInput,
      searchForm,
      clearButton,
      resetButton,
      tagButtons,
      noResults,
      postList,
      postListAll,
      paginationContainer,
      viewToggle,
      paginationIcon,
      allIcon,
      viewLabel,
    };
  }

  async init(): Promise<void> {
    try {
      // Initialize WASM search engine
      await wasmPostSearch.init(this.allPosts);

      // Restore search state
      const { searchTerm, activeTag, viewAll } =
        PostSearchState.getSearchState();
      this.isViewingAll = viewAll || false;
      this.currentActiveTag = activeTag || "";

      // Initialize UI from saved state
      this.initializeFromState(searchTerm, activeTag);

      // Set up event listeners
      this.setupEventListeners();

      // Apply initial filter with saved state
      this.updateViewMode(this.isViewingAll);

      this.isInitialized = true;
      console.log("WASM post search UI initialized");
    } catch (error) {
      console.error("Failed to initialize WASM search UI:", error);
      // Fallback to basic functionality without WASM
      this.setupBasicEventListeners();
    }
  }

  private initializeFromState(searchTerm: string, activeTag: string): void {
    // Initialize search field
    if (searchTerm) {
      this.elements.searchInput.value = searchTerm;
      this.elements.clearButton.style.display = "";
    }

    // Initialize tag selection
    if (activeTag) {
      this.elements.tagButtons.forEach((btn) => {
        if (btn.getAttribute("data-tag") === activeTag) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    } else {
      // Make "All" active by default
      const allTagButton = Array.from(this.elements.tagButtons).find(
        (btn) => btn.getAttribute("data-tag") === "",
      );
      if (allTagButton) {
        allTagButton.classList.add("active");
      }
    }
  }

  private setupEventListeners(): void {
    // Search form submission
    this.elements.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.performSearch();
    });

    // Search input changes
    this.elements.searchInput.addEventListener("input", () => {
      this.elements.clearButton.style.display = this.elements.searchInput.value
        ? ""
        : "none";
    });

    // Clear search
    this.elements.clearButton.addEventListener("click", () => {
      this.elements.searchInput.value = "";
      this.performSearch();
    });

    // Tag filtering
    this.elements.tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tagValue = btn.getAttribute("data-tag") || "";
        this.handleTagSelection(tagValue);
      });
    });

    // View toggle (only if element exists)
    if (this.elements.viewToggle) {
      this.elements.viewToggle.addEventListener("click", () => {
        this.updateViewMode(!this.isViewingAll);
      });
    }

    // Reset filters
    this.elements.resetButton.addEventListener("click", () => {
      this.resetFilters();
    });

    // Save state when navigating with pagination
    document
      .querySelectorAll<HTMLAnchorElement>(".pagination-link")
      .forEach((link) => {
        link.addEventListener("click", () => {
          this.saveCurrentState();
        });
      });
  }

  private setupBasicEventListeners(): void {
    // Fallback to basic DOM filtering if WASM fails
    console.warn("Using fallback DOM-based search");

    this.elements.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.performBasicSearch();
    });

    this.elements.searchInput.addEventListener("input", () => {
      this.elements.clearButton.style.display = this.elements.searchInput.value
        ? ""
        : "none";
    });

    this.elements.clearButton.addEventListener("click", () => {
      this.elements.searchInput.value = "";
      this.performBasicSearch();
    });

    // Tag filtering
    this.elements.tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tagValue = btn.getAttribute("data-tag") || "";
        this.handleTagSelection(tagValue);
      });
    });

    // View toggle (only if element exists)
    if (this.elements.viewToggle) {
      this.elements.viewToggle.addEventListener("click", () => {
        this.updateViewMode(!this.isViewingAll);
      });
    }

    // Reset filters
    this.elements.resetButton.addEventListener("click", () => {
      this.resetFilters();
    });

    // Save state when navigating with pagination
    document
      .querySelectorAll<HTMLAnchorElement>(".pagination-link")
      .forEach((link) => {
        link.addEventListener("click", () => {
          this.saveCurrentState();
        });
      });
  }

  private async performSearch(): Promise<void> {
    if (!this.isInitialized) {
      this.performBasicSearch();
      return;
    }

    const searchTerm = this.elements.searchInput.value.toLowerCase().trim();

    try {
      // Use WASM search for better performance
      const matchedPosts = wasmPostSearch.combinedSearch(
        searchTerm,
        this.currentActiveTag,
        100,
      );

      // Update UI with results
      this.updatePostsDisplay(matchedPosts, searchTerm);

      // Save search state
      this.saveCurrentState();
    } catch (error) {
      console.error("WASM search failed, falling back to basic search:", error);
      this.performBasicSearch();
    }
  }

  private performBasicSearch(): void {
    const searchTerm = this.elements.searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    // Determine which list to display
    const displayingPaginated = !this.isViewingAll && !searchTerm;
    const displayingAll = this.isViewingAll || searchTerm;

    // Show/hide appropriate lists
    this.elements.postList.style.display = displayingPaginated ? "" : "none";
    this.elements.postListAll.style.display = displayingAll ? "" : "none";
    this.elements.paginationContainer.style.display = displayingPaginated
      ? ""
      : "none";

    // Filter posts in the visible list
    const itemsToFilter = displayingAll
      ? this.elements.postListAll.querySelectorAll<HTMLLIElement>(
          ".post-dropdown-item",
        )
      : this.elements.postList.querySelectorAll<HTMLLIElement>(
          ".post-dropdown-item",
        );

    itemsToFilter.forEach((post) => {
      const titleElement = post.querySelector(".post-title");
      const descriptionElement = post.querySelector(".post-description");
      if (!titleElement) return;

      const title = titleElement.textContent?.toLowerCase() || "";
      const description = descriptionElement?.textContent?.toLowerCase() || "";
      const keywordsText = post.getAttribute("data-keywords") || "";
      const keywords = keywordsText
        ? keywordsText.toLowerCase().split(",")
        : [];

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm);
      const matchesTag =
        !this.currentActiveTag ||
        keywords.includes(this.currentActiveTag.toLowerCase());

      post.style.display = matchesSearch && matchesTag ? "" : "none";
      if (matchesSearch && matchesTag) visibleCount++;
    });

    // Show/hide no results message
    this.elements.noResults.style.display =
      visibleCount === 0 ? "block" : "none";
    this.elements.clearButton.style.display = this.elements.searchInput.value
      ? ""
      : "none";
  }

  private updatePostsDisplay(
    matchedPosts: PostEntry[],
    searchTerm: string,
  ): void {
    const hasResults = matchedPosts.length > 0;
    const displayingAll = this.isViewingAll || searchTerm;

    // Show/hide appropriate lists
    this.elements.postList.style.display = displayingAll ? "none" : "";
    this.elements.postListAll.style.display = displayingAll ? "" : "none";
    this.elements.paginationContainer.style.display = displayingAll
      ? "none"
      : "";

    if (displayingAll) {
      // Hide all posts first
      const allItems =
        this.elements.postListAll.querySelectorAll<HTMLLIElement>(
          ".post-dropdown-item",
        );
      allItems.forEach((item) => (item.style.display = "none"));

      // Show only matched posts
      matchedPosts.forEach((post) => {
        const postElement = this.elements.postListAll.querySelector(
          `[data-post-id="${post.id}"]`,
        ) as HTMLLIElement;
        if (postElement) {
          postElement.style.display = "";
        }
      });
    }

    // Show/hide no results message
    this.elements.noResults.style.display = hasResults ? "none" : "block";
    this.elements.clearButton.style.display = this.elements.searchInput.value
      ? ""
      : "none";
  }

  private handleTagSelection(tagValue: string): void {
    // Update active tag
    this.elements.tagButtons.forEach((b) => b.classList.remove("active"));
    const selectedButton = Array.from(this.elements.tagButtons).find(
      (btn) => btn.getAttribute("data-tag") === tagValue,
    );
    if (selectedButton) {
      selectedButton.classList.add("active");
    }

    this.currentActiveTag = tagValue;

    // If a tag is selected (not "All"), automatically switch to view all posts
    if (tagValue !== "" && !this.isViewingAll) {
      this.isViewingAll = true;
      this.updateViewMode(true);
    } else {
      this.performSearch();
    }
  }

  private updateViewMode(viewAll: boolean): void {
    this.isViewingAll = viewAll;

    if (viewAll) {
      this.elements.postList.style.display = "none";
      this.elements.postListAll.style.display = "";
      this.elements.paginationContainer.style.display = "none";
      if (this.elements.paginationIcon) {
        this.elements.paginationIcon.style.display = "none";
      }
      if (this.elements.allIcon) {
        this.elements.allIcon.style.display = "";
      }
      if (this.elements.viewLabel) {
        this.elements.viewLabel.textContent = "Paginate";
      }
    } else {
      this.elements.postList.style.display = "";
      this.elements.postListAll.style.display = "none";
      this.elements.paginationContainer.style.display = "";
      if (this.elements.paginationIcon) {
        this.elements.paginationIcon.style.display = "";
      }
      if (this.elements.allIcon) {
        this.elements.allIcon.style.display = "none";
      }
      if (this.elements.viewLabel) {
        this.elements.viewLabel.textContent = "View All";
      }
    }

    this.performSearch();
  }

  private resetFilters(): void {
    this.elements.searchInput.value = "";
    this.currentActiveTag = "";
    this.elements.tagButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tag") === "") {
        btn.classList.add("active");
      }
    });
    PostSearchState.clearSearchState();
    this.performSearch();
  }

  private saveCurrentState(): void {
    PostSearchState.setSearchState(
      this.elements.searchInput.value,
      this.currentActiveTag,
      this.isViewingAll,
    );
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Get all posts data from the DOM
  const allPostElements =
    document.querySelectorAll<HTMLLIElement>("[data-post-id]");
  const allPosts: PostEntry[] = Array.from(allPostElements).map((element) => {
    const id = element.getAttribute("data-post-id") || "";
    const titleElement = element.querySelector(".post-title");
    const descriptionElement = element.querySelector(".post-description");
    const keywords = (element.getAttribute("data-keywords") || "")
      .split(",")
      .filter((k) => k.trim());

    return {
      id,
      data: {
        title: titleElement?.textContent || "",
        description: descriptionElement?.textContent || undefined,
        keywords,
        date: new Date(), // we don't need the actual date for search
        draft: false,
        archived: false,
      },
    } as PostEntry;
  });

  if (allPosts.length > 0) {
    const searchUI = new WasmPostSearchUI(allPosts);
    searchUI.init();
  }
});
