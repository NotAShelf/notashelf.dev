import { PostSearchState } from "./utils/post-search";
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

export class PostSearchUI {
  private elements: DOMElements;
  private isViewingAll = false;
  private currentActiveTag = "";
  private isRecentlyUpdatedFilter = false;
  private debounceTimer: number = 0;
  private eventListenersAttached = false;

  private cachedPostElements: {
    paginated: NodeListOf<HTMLLIElement> | null;
    all: NodeListOf<HTMLLIElement> | null;
  } = { paginated: null, all: null };

  // allPosts kept for API compatibility
  constructor(_allPosts: PostEntry[] = []) {
    this.elements = this.getDOMElements();
  }

  private getDOMElements(): DOMElements {
    const getRequired = <T extends HTMLElement>(id: string): T => {
      const el = document.getElementById(id) as T | null;
      if (!el) {
        console.warn(`Required element #${id} not found, using fallback`);
        const fallback = document.createElement("div") as unknown as T;
        fallback.id = id;
        fallback.hidden = true;
        return fallback;
      }
      return el;
    };

    const getRequiredBySelector = <T extends HTMLElement>(
      selector: string,
    ): T => {
      const el = document.querySelector(selector) as T | null;
      if (!el) {
        console.warn(`Required element "${selector}" not found, using fallback`);
        const fallback = document.createElement("div") as unknown as T;
        fallback.hidden = true;
        return fallback;
      }
      return el;
    };

    const getOptional = <T extends HTMLElement>(id: string): T | null =>
      document.getElementById(id) as T | null;

    return {
      searchInput: getRequired<HTMLInputElement>("search-input"),
      searchForm: getRequired<HTMLFormElement>("search-form"),
      clearButton: getRequired<HTMLButtonElement>("clear-search"),
      resetButton: getRequired<HTMLButtonElement>("reset-filters"),
      tagButtons: document.querySelectorAll(
        ".tag-filter",
      ) as NodeListOf<HTMLButtonElement>,
      noResults: getRequiredBySelector<HTMLDivElement>(".no-results"),
      postList: getRequiredBySelector<HTMLUListElement>(".post-list"),
      postListAll: getRequiredBySelector<HTMLUListElement>(".post-list-all"),
      paginationContainer: getRequired<HTMLDivElement>("pagination-container"),
      viewToggle: getOptional<HTMLButtonElement>("view-toggle"),
      paginationIcon: getOptional<HTMLElement>("pagination-icon"),
      allIcon: getOptional<HTMLElement>("all-icon"),
      viewLabel: getOptional<HTMLElement>("view-label"),
    };
  }

  async init(): Promise<void> {
    try {
      this.cleanupEventListeners();

      const { searchTerm, activeTag, viewAll } =
        PostSearchState.getSearchState();
      this.isViewingAll = viewAll || false;
      this.currentActiveTag = activeTag || "";

      this.initializeFromState(searchTerm, activeTag);
      this.setupEventListeners();
      this.updateViewMode(this.isViewingAll);
      this.initializeCachedElements();

      this.eventListenersAttached = true;
    } catch (error) {
      console.error("Failed to initialize search UI:", error);
    }
  }

  private initializeCachedElements(): void {
    this.cachedPostElements.paginated =
      this.elements.postList.querySelectorAll<HTMLLIElement>(
        ".post-dropdown-item",
      );
    this.cachedPostElements.all =
      this.elements.postListAll.querySelectorAll<HTMLLIElement>(
        ".post-dropdown-item",
      );
  }

  private cleanupEventListeners(): void {
    if (!this.eventListenersAttached) return;

    const clone = <T extends HTMLElement>(el: T): T => {
      const newEl = el.cloneNode(true) as T;
      el.replaceWith(newEl);
      return newEl;
    };

    this.elements.searchForm = clone(this.elements.searchForm);
    // Re-query form children from the cloned form to avoid stale references
    this.elements.searchInput =
      (this.elements.searchForm.querySelector("#search-input") as HTMLInputElement | null) ??
      (this.elements.searchForm.querySelector("[type=text]") as HTMLInputElement | null) ??
      this.elements.searchInput;
    this.elements.clearButton =
      (this.elements.searchForm.querySelector("#clear-search") as HTMLButtonElement | null) ??
      this.elements.clearButton;
    this.elements.resetButton = clone(this.elements.resetButton);
    if (this.elements.viewToggle) {
      this.elements.viewToggle = clone(this.elements.viewToggle);
    }
    this.elements.tagButtons = document.querySelectorAll(
      ".tag-filter",
    ) as NodeListOf<HTMLButtonElement>;
    this.eventListenersAttached = false;
  }

  private setupEventListeners(): void {
    this.elements.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.performSearch();
    });

    this.elements.searchInput.addEventListener("input", () => {
      this.elements.clearButton.style.display = this.elements.searchInput.value
        ? ""
        : "none";
      clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => this.performSearch(), 300);
    });

    this.elements.clearButton.addEventListener("click", () => {
      this.elements.searchInput.value = "";
      this.elements.clearButton.style.display = "none";
      this.performSearch();
    });

    this.elements.tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tagValue = btn.getAttribute("data-tag") || "";
        const filterType = btn.getAttribute("data-filter") || "";
        if (filterType === "recently-updated") {
          this.handleRecentlyUpdatedFilter();
        } else {
          this.handleTagSelection(tagValue);
        }
      });
    });

    if (this.elements.viewToggle) {
      this.elements.viewToggle.addEventListener("click", () => {
        this.updateViewMode(!this.isViewingAll);
      });
    }

    this.elements.resetButton.addEventListener("click", () =>
      this.resetFilters(),
    );

    document
      .querySelectorAll<HTMLAnchorElement>(".pagination-link")
      .forEach((link) => {
        link.addEventListener("click", () => this.saveCurrentState());
      });
  }

  private initializeFromState(searchTerm: string, activeTag: string): void {
    if (searchTerm) {
      this.elements.searchInput.value = searchTerm;
      this.elements.clearButton.style.display = "";
    }

    if (activeTag) {
      this.elements.tagButtons.forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.getAttribute("data-tag") === activeTag,
        );
      });
    } else {
      const allBtn = Array.from(this.elements.tagButtons).find(
        (btn) => btn.getAttribute("data-tag") === "",
      );
      allBtn?.classList.add("active");
    }
  }

  private performSearch(): void {
    const searchTerm =
      this.elements.searchInput?.value?.toLowerCase().trim() || "";
    let visibleCount = 0;

    const displayingPaginated =
      !this.isViewingAll && !searchTerm && !this.isRecentlyUpdatedFilter;
    const displayingAll =
      this.isViewingAll || !!searchTerm || this.isRecentlyUpdatedFilter;

    this.elements.postList.style.display = displayingPaginated ? "" : "none";
    this.elements.postListAll.style.display = displayingAll ? "" : "none";
    this.elements.paginationContainer.style.display = displayingPaginated
      ? ""
      : "none";

    const itemsToFilter = displayingAll
      ? (this.cachedPostElements.all ??
        this.elements.postListAll.querySelectorAll<HTMLLIElement>(
          ".post-dropdown-item",
        ))
      : (this.cachedPostElements.paginated ??
        this.elements.postList.querySelectorAll<HTMLLIElement>(
          ".post-dropdown-item",
        ));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    itemsToFilter.forEach((post) => {
      const titleEl = post.querySelector(".post-title");
      const descEl = post.querySelector(".post-description");
      if (!titleEl) return;

      const title = titleEl.textContent?.toLowerCase() || "";
      const description = descEl?.textContent?.toLowerCase() || "";
      const keywords = (post.getAttribute("data-keywords") || "")
        .toLowerCase()
        .split(",")
        .map((k) => k.trim());

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm);
      const matchesTag =
        !this.currentActiveTag ||
        keywords.includes(this.currentActiveTag.toLowerCase());

      let matchesRecentlyUpdated = true;
      if (this.isRecentlyUpdatedFilter) {
        const hasUpdate =
          post.getAttribute("data-has-significant-update") === "true";
        const updatedStr = post.getAttribute("data-updated") || "";
        matchesRecentlyUpdated =
          hasUpdate && !!updatedStr && new Date(updatedStr) >= thirtyDaysAgo;
      }

      const show = matchesSearch && matchesTag && matchesRecentlyUpdated;
      post.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    this.elements.noResults.style.display =
      visibleCount === 0 ? "block" : "none";
    this.elements.clearButton.style.display = this.elements.searchInput?.value
      ? ""
      : "none";
  }

  private handleRecentlyUpdatedFilter(): void {
    this.isRecentlyUpdatedFilter = !this.isRecentlyUpdatedFilter;

    if (this.isRecentlyUpdatedFilter) this.currentActiveTag = "";

    this.elements.tagButtons.forEach((btn) => {
      const isRecentBtn =
        btn.getAttribute("data-filter") === "recently-updated";
      btn.classList.toggle(
        "active",
        isRecentBtn && this.isRecentlyUpdatedFilter,
      );
    });

    if (!this.isRecentlyUpdatedFilter) {
      Array.from(this.elements.tagButtons)
        .find((btn) => btn.getAttribute("data-tag") === "")
        ?.classList.add("active");
    }

    if (this.isRecentlyUpdatedFilter && !this.isViewingAll) {
      this.isViewingAll = true;
      this.updateViewMode(true);
    }

    this.performSearch();
  }

  private handleTagSelection(tagValue: string): void {
    this.isRecentlyUpdatedFilter = false;
    this.elements.tagButtons.forEach((b) => b.classList.remove("active"));
    Array.from(this.elements.tagButtons)
      .find((btn) => btn.getAttribute("data-tag") === tagValue)
      ?.classList.add("active");

    this.currentActiveTag = tagValue;

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
      if (this.elements.paginationIcon)
        this.elements.paginationIcon.style.display = "none";
      if (this.elements.allIcon) this.elements.allIcon.style.display = "";
      if (this.elements.viewLabel)
        this.elements.viewLabel.textContent = "Paginate";
    } else {
      this.elements.postList.style.display = "";
      this.elements.postListAll.style.display = "none";
      this.elements.paginationContainer.style.display = "";
      if (this.elements.paginationIcon)
        this.elements.paginationIcon.style.display = "";
      if (this.elements.allIcon) this.elements.allIcon.style.display = "none";
      if (this.elements.viewLabel)
        this.elements.viewLabel.textContent = "View All";
    }

    this.performSearch();
  }

  private resetFilters(): void {
    this.elements.searchInput.value = "";
    this.currentActiveTag = "";
    this.isRecentlyUpdatedFilter = false;
    this.elements.clearButton.style.display = "none";

    this.elements.tagButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tag") === "") btn.classList.add("active");
    });

    document
      .querySelectorAll<HTMLLIElement>(".post-dropdown-item")
      .forEach((item) => {
        item.style.display = "";
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
