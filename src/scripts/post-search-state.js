// Helps manage search state across pages
const PostSearchState = {
  getSearchState() {
    if (typeof window === "undefined")
      return { searchTerm: "", activeTag: "", viewAll: false };

    try {
      const searchState = localStorage.getItem("postSearchState");
      return searchState
        ? JSON.parse(searchState)
        : { searchTerm: "", activeTag: "", viewAll: false };
    } catch (e) {
      console.error("Error retrieving search state:", e);
      return { searchTerm: "", activeTag: "", viewAll: false };
    }
  },

  setSearchState(searchTerm, activeTag, viewAll = false) {
    if (typeof window === "undefined") return;

    try {
      const stateToStore = {
        searchTerm: searchTerm || "",
        activeTag: activeTag || "",
        viewAll: !!viewAll,
      };

      localStorage.setItem("postSearchState", JSON.stringify(stateToStore));
    } catch (e) {
      console.error("Error storing search state:", e);
    }
  },

  clearSearchState() {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem("postSearchState");
    } catch (e) {
      console.error("Error clearing search state:", e);
    }
  },
};

// Initialize filtering state if needed
if (typeof document !== "undefined") {
  const { searchTerm, activeTag } = PostSearchState.getSearchState();
  if (searchTerm || activeTag) {
    document.documentElement.classList.add("filtering-active");
  }
}

export default PostSearchState;
