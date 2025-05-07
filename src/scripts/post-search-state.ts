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
   * Save the current search state to `sessionStorage`
   */
  static setSearchState(
    searchTerm: string,
    activeTag: string,
    viewAll: boolean,
  ): void {
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
    try {
      const state = sessionStorage.getItem(this.STORAGE_KEY);
      return state
        ? JSON.parse(state)
        : { searchTerm: "", activeTag: "", viewAll: false };
    } catch (e) {
      console.error("Failed to retrieve search state:", e);
      return { searchTerm: "", activeTag: "", viewAll: false };
    }
  }

  /**
   * Clear the saved search state
   */
  static clearSearchState(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear search state:", e);
    }
  }
}

export default PostSearchState;
