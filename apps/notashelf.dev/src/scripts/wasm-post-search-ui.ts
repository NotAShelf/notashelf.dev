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
  private eventListenersAttached = false; // track event listener setup

  // Function that will be initialized properly in setupLazyWasmLoading
  private initWasmOnDemand: () => Promise<void | null> = async () =>
    Promise.resolve(null);

  // Method to clean up any attached event listeners
  public cleanup(): void {
    // Remove search form listeners
    if (this.elements.searchForm) {
      this.elements.searchForm.removeEventListener(
        "submit",
        this.handleSearchFormSubmit,
      );
    }

    if (this.elements.searchInput) {
      this.elements.searchInput.removeEventListener(
        "input",
        this.handleSearchInputInput,
      );
      this.elements.searchInput.removeEventListener(
        "focus",
        this.handleSearchInputFocus,
      );
    }

    if (this.elements.clearButton) {
      this.elements.clearButton.removeEventListener(
        "click",
        this.handleClearButtonClick,
      );
    }

    // Remove tag button listeners
    this.elements.tagButtons.forEach((btn) => {
      btn.removeEventListener("click", this.handleTagButtonClick);
    });

    // Remove view toggle listener
    if (this.elements.viewToggle) {
      this.elements.viewToggle.removeEventListener(
        "click",
        this.handleViewToggleClick,
      );
    }

    // Remove reset button listener
    if (this.elements.resetButton) {
      this.elements.resetButton.removeEventListener(
        "click",
        this.handleResetButtonClick,
      );
    }

    // Remove pagination link listeners
    document
      .querySelectorAll<HTMLAnchorElement>(".pagination-link")
      .forEach((link) => {
        link.removeEventListener("click", this.handlePaginationLinkClick);
      });

    this.eventListenersAttached = false;
  }

  // Event handler methods bound to this instance
  private handleSearchFormSubmit = (e: Event): void => {
    e.preventDefault();
    this.performSearch();
  };

  private handleSearchInputInput = (): void => {
    this.elements.clearButton.style.display = this.elements.searchInput.value
      ? ""
      : "none";
    clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      if (this.elements.searchInput.value.trim()) {
        this.initWasmOnDemand().then(() => {
          this.performSearch();
        });
      } else {
        this.performSearch();
      }
    }, 300);
  };

  private handleClearButtonClick = (): void => {
    this.elements.searchInput.value = "";
    this.elements.clearButton.style.display = "none";
    this.performSearch();
  };

  private handleSearchInputFocus = (): void => {
    setTimeout(() => this.initWasmOnDemand(), 100);
  };

  private handleTagButtonClick = (e: Event): void => {
    const btn = e.currentTarget as HTMLButtonElement;
    const tagValue = btn.getAttribute("data-tag") || "";
    this.handleTagSelection(tagValue);
  };

  private handleViewToggleClick = (): void => {
    this.updateViewMode(!this.isViewingAll);
  };

  private handleResetButtonClick = (): void => {
    this.resetFilters();
  };

  private handlePaginationLinkClick = (): void => {
    this.saveCurrentState();
  };

  private eventHandlers = {
    // Search form handlers
    searchFormSubmit: (e: Event) => {
      e.preventDefault();
      this.performSearch();
    },

    searchInputInput: () => {
      this.elements.clearButton.style.display = this.elements.searchInput.value
        ? ""
        : "none";

      clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        if (this.elements.searchInput.value.trim()) {
          this.initWasmOnDemand().then(() => {
            this.performSearch();
          });
        } else {
          this.performSearch();
        }
      }, 300);
    },

    clearButtonClick: () => {
      this.elements.searchInput.value = "";
      this.elements.clearButton.style.display = "none";
      this.performSearch();
    },

    searchInputFocus: () => {
      setTimeout(() => this.initWasmOnDemand(), 100);
    },

    // Basic search handlers
    basicSearchFormSubmit: (e: Event) => {
      e.preventDefault();
      this.performBasicSearch();
    },

    basicSearchInputInput: () => {
      this.elements.clearButton.style.display = this.elements.searchInput.value
        ? ""
        : "none";

      clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        this.performBasicSearch();
      }, 300);
    },

    basicClearButtonClick: () => {
      this.elements.searchInput.value = "";
      this.performBasicSearch();
    },

    // Shared handlers
    tagButtonClick: (btn: HTMLButtonElement) => {
      const tagValue = btn.getAttribute("data-tag") || "";
      this.handleTagSelection(tagValue);
    },

    viewToggleClick: () => {
      this.updateViewMode(!this.isViewingAll);
    },

    resetButtonClick: () => {
      this.resetFilters();
    },

    paginationLinkClick: () => {
      this.saveCurrentState();
    },
  };

  constructor(allPosts: PostEntry[]) {
    this.allPosts = allPosts;
    this.elements = this.getDOMElements();
  }

  private getDOMElements(): DOMElements {
    // Non-nullable version - throws error if element not found
    const getRequiredElement = <T extends HTMLElement>(id: string): T => {
      const element = document.getElementById(id) as T | null;
      if (!element) {
        throw new Error(`Required element #${id} not found`);
      }
      return element;
    };

    // Nullable version, returns null if element not found
    const getOptionalElement = <T extends HTMLElement>(
      id: string,
    ): T | null => {
      return document.getElementById(id) as T | null;
    };

    // Non-nullable version, throws error if element not found
    const getRequiredElementBySelector = <T extends HTMLElement>(
      selector: string,
    ): T => {
      const element = document.querySelector(selector) as T | null;
      if (!element) {
        throw new Error(`Required element ${selector} not found`);
      }
      return element;
    };

    return {
      searchInput: getRequiredElement<HTMLInputElement>("search-input"),
      searchForm: getRequiredElement<HTMLFormElement>("search-form"),
      clearButton: getRequiredElement<HTMLButtonElement>("clear-search"),
      resetButton: getRequiredElement<HTMLButtonElement>("reset-filters"),
      tagButtons: document.querySelectorAll(
        ".tag-filter",
      ) as NodeListOf<HTMLButtonElement>,
      noResults: getRequiredElementBySelector<HTMLDivElement>(".no-results"),
      postList: getRequiredElementBySelector<HTMLUListElement>(".post-list"),
      postListAll:
        getRequiredElementBySelector<HTMLUListElement>(".post-list-all"),
      paginationContainer: getRequiredElement<HTMLDivElement>(
        "pagination-container",
      ),
      viewToggle: getOptionalElement<HTMLButtonElement>("view-toggle"),
      paginationIcon: getOptionalElement<HTMLElement>("pagination-icon"),
      allIcon: getOptionalElement<HTMLElement>("all-icon"),
      viewLabel: getOptionalElement<HTMLElement>("view-label"),
    };
  }

  async init(): Promise<void> {
    try {
      // Clean up any existing event listeners before initializing
      this.cleanupEventListeners();

      const hasSearchElements =
        this.elements.searchInput && this.elements.searchForm;
      if (!hasSearchElements) {
        this.setupBasicEventListeners();
        return;
      }

      const { searchTerm, activeTag, viewAll } =
        PostSearchState.getSearchState();
      this.isViewingAll = viewAll || false;
      this.currentActiveTag = activeTag || "";

      this.initializeFromState(searchTerm, activeTag);
      this.setupLazyWasmLoading();
      this.setupNonSearchEventListeners();
      this.updateViewMode(this.isViewingAll);

      this.eventListenersAttached = true;
    } catch (error) {
      console.error("Failed to initialize search UI:", error);
      this.setupBasicEventListeners();
    }
  }

  // Clean up event listeners by cloning and replacing elements
  private cleanupEventListeners(): void {
    if (!this.eventListenersAttached) {
      return; // means no listeners to clean up
    }

    // Clone and replace primary interactive elements to remove all listeners
    if (this.elements.searchForm) {
      const newForm = this.elements.searchForm.cloneNode(
        true,
      ) as HTMLFormElement;
      this.elements.searchForm.replaceWith(newForm);
      this.elements.searchForm = newForm;
    }

    if (this.elements.searchInput) {
      const newInput = this.elements.searchInput.cloneNode(
        true,
      ) as HTMLInputElement;
      this.elements.searchInput.replaceWith(newInput);
      this.elements.searchInput = newInput;
    }

    if (this.elements.clearButton) {
      const newButton = this.elements.clearButton.cloneNode(
        true,
      ) as HTMLButtonElement;
      this.elements.clearButton.replaceWith(newButton);
      this.elements.clearButton = newButton;
    }

    if (this.elements.resetButton) {
      const newResetButton = this.elements.resetButton.cloneNode(
        true,
      ) as HTMLButtonElement;
      this.elements.resetButton.replaceWith(newResetButton);
      this.elements.resetButton = newResetButton;
    }

    if (this.elements.viewToggle) {
      const newViewToggle = this.elements.viewToggle.cloneNode(
        true,
      ) as HTMLButtonElement;
      this.elements.viewToggle.replaceWith(newViewToggle);
      this.elements.viewToggle = newViewToggle;
    }

    // Update tag buttons NodeList after DOM changes
    this.elements.tagButtons = document.querySelectorAll(
      ".tag-filter",
    ) as NodeListOf<HTMLButtonElement>;

    this.eventListenersAttached = false;
  }

  private setupLazyWasmLoading(): void {
    let wasmInitPromise: Promise<void | null> | null = null;

    // Assign to the class property
    this.initWasmOnDemand = async () => {
      if (this.isInitialized || wasmInitPromise) {
        return wasmInitPromise;
      }

      wasmInitPromise = (async () => {
        try {
          await wasmPostSearch.init(this.allPosts);
          this.isInitialized = true;
          return;
        } catch {
          console.error("Failed to lazy-load WASM search engine");
          return null;
        }
      })();

      return wasmInitPromise;
    };

    // Set up search form handler
    this.elements.searchForm.addEventListener(
      "submit",
      this.eventHandlers.searchFormSubmit,
    );

    this.elements.searchInput.addEventListener(
      "input",
      this.eventHandlers.searchInputInput,
    );

    // Set up clear button
    this.elements.clearButton.addEventListener(
      "click",
      this.eventHandlers.clearButtonClick,
    );

    // Also initialize WASM on focus (but with delay to avoid blocking)
    this.elements.searchInput.addEventListener(
      "focus",
      this.eventHandlers.searchInputFocus,
    );
  }

  private debounceTimer: number = 0;

  private setupNonSearchEventListeners(): void {
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

  private setupBasicEventListeners(): void {
    this.elements.searchForm.addEventListener(
      "submit",
      this.eventHandlers.basicSearchFormSubmit,
    );

    this.elements.searchInput.addEventListener(
      "input",
      this.eventHandlers.basicSearchInputInput,
    );

    this.elements.clearButton.addEventListener(
      "click",
      this.eventHandlers.basicClearButtonClick,
    );

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
      const matchedPosts = wasmPostSearch.combinedSearch(
        searchTerm,
        this.currentActiveTag,
        100,
      );
      this.updatePostsDisplay(matchedPosts, searchTerm);
      this.saveCurrentState();
    } catch (error) {
      console.error("WASM search failed, falling back to basic search:", error);
      this.performBasicSearch();
    }
  }

  private performBasicSearch(): void {
    const searchTerm = this.elements.searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    const displayingPaginated = !this.isViewingAll && !searchTerm;
    const displayingAll = this.isViewingAll || searchTerm;

    this.elements.postList.style.display = displayingPaginated ? "" : "none";
    this.elements.postListAll.style.display = displayingAll ? "" : "none";
    this.elements.paginationContainer.style.display = displayingPaginated
      ? ""
      : "none";

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
        ? keywordsText
            .toLowerCase()
            .split(",")
            .map((k) => k.trim())
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
/**
 * Extracts post data from DOM elements
 * This can be used by page templates to initialize the search UI
 */
export function extractPostsFromDOM(): PostEntry[] {
  const allPostElements =
    document.querySelectorAll<HTMLLIElement>("[data-post-id]");

  return Array.from(allPostElements).map((element) => {
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
}

// Export a singleton instance tracking mechanism
export const postSearchUIRegistry = {
  instance: null as WasmPostSearchUI | null,

  /**
   * Initialize the post search UI if not already initialized
   */
  init(posts: PostEntry[]): WasmPostSearchUI {
    if (this.instance) {
      console.log(
        "Post search UI already initialized, reusing existing instance",
      );
      return this.instance;
    }

    this.instance = new WasmPostSearchUI(posts);
    this.instance.init();
    return this.instance;
  },
};
