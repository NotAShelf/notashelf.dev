export interface PostSearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
  recentlyUpdated: boolean;
}

export const POST_SEARCH_STORAGE_KEY = "post-search-state";

export const DEFAULT_POST_SEARCH_STATE: PostSearchState = {
  searchTerm: "",
  activeTag: "",
  viewAll: false,
  recentlyUpdated: false,
};

function isPostSearchState(value: unknown): value is PostSearchState {
  if (value === null || typeof value !== "object") return false;

  const state = value as Record<string, unknown>;
  return (
    typeof state.searchTerm === "string" &&
    typeof state.activeTag === "string" &&
    typeof state.viewAll === "boolean" &&
    typeof state.recentlyUpdated === "boolean"
  );
}

export function loadPostSearchState(): PostSearchState {
  try {
    const saved = sessionStorage.getItem(POST_SEARCH_STORAGE_KEY);
    if (!saved) return DEFAULT_POST_SEARCH_STATE;

    const parsed = JSON.parse(saved);
    return isPostSearchState(parsed) ? parsed : DEFAULT_POST_SEARCH_STATE;
  } catch {
    return DEFAULT_POST_SEARCH_STATE;
  }
}

export function savePostSearchState(state: PostSearchState): void {
  try {
    sessionStorage.setItem(POST_SEARCH_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearPostSearchState(): void {
  try {
    sessionStorage.removeItem(POST_SEARCH_STORAGE_KEY);
  } catch {}
}
