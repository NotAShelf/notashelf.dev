interface SearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
}

/**
 * Manage search state persistence across page navigation
 */
class PostSearchState {
  private static readonly STORAGE_KEY = "post-search-state";

  /**
   * Check if we're running in a browser environment with sessionStorage support
   */
  private static isBrowser(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.sessionStorage !== "undefined"
    );
  }

  /**
   * Save the current search state to `sessionStorage`
   */
  static setSearchState(
    searchTerm: string,
    activeTag: string,
    viewAll: boolean,
  ): void {
    if (!this.isBrowser()) {
      return; // Skip on server-side
    }

    const state: SearchState = { searchTerm, activeTag, viewAll };
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save search state:", e);
    }
  }

  /**
   * Get the saved search state from `sessionStorage`
   */
  static getSearchState(): SearchState {
    const defaultState: SearchState = {
      searchTerm: "",
      activeTag: "",
      viewAll: false,
    };

    if (!this.isBrowser()) {
      return defaultState; // Return default state on server-side
    }

    try {
      const state = sessionStorage.getItem(this.STORAGE_KEY);
      if (!state) return defaultState;

      const parsedState = JSON.parse(state);

      // Validate the parsed state matches SearchState interface
      if (!this.isValidSearchState(parsedState)) {
        console.warn("Invalid search state format in sessionStorage");
        return defaultState;
      }

      return parsedState;
    } catch (e) {
      console.error("Failed to retrieve search state:", e);
      return defaultState;
    }
  }

  /**
   * Type guard to validate if an object conforms to SearchState interface
   */
  private static isValidSearchState(obj: unknown): obj is SearchState {
    if (obj === null || typeof obj !== "object") {
      return false;
    }

    const record = obj as Record<string, unknown>;
    return (
      "searchTerm" in record &&
      typeof record.searchTerm === "string" &&
      "activeTag" in record &&
      typeof record.activeTag === "string" &&
      "viewAll" in record &&
      typeof record.viewAll === "boolean"
    );
  }

  /**
   * Clear the saved search state
   */
  static clearSearchState(): void {
    if (!this.isBrowser()) {
      return; // Skip on server-side
    }

    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear search state:", e);
    }
  }
}

export default PostSearchState;
