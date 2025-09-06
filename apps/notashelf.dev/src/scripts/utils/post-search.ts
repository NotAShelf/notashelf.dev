/**
 * Application-specific post search functionality
 * Wraps WASM search engine with business logic and state management
 */

import {
  wasmSearchEngine,
  type PostData,
  type SearchResult,
  type SearchStats,
} from "../../lib/wasm";
import type { PostEntry } from "../../lib/types";

export interface SearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
}

export class PostSearch {
  private searchEngine = wasmSearchEngine;
  private isInitialized = false;
  private allPosts: PostEntry[] = [];

  async init(posts: PostEntry[]): Promise<void> {
    if (this.isInitialized) return;

    await this.searchEngine.init();
    this.searchEngine.clear();
    this.allPosts = posts;

    for (const post of posts) {
      const postData: PostData = {
        id: post.id,
        title: post.data.title,
        description: post.data.description,
        keywords: post.data.keywords || [],
      };
      this.searchEngine.addPost(postData);
    }

    this.isInitialized = true;
  }

  search(query: string, maxResults: number = 50): SearchResult[] {
    if (!this.isInitialized || !query.trim()) return [];
    try {
      return this.searchEngine.search(query, maxResults);
    } catch {
      return [];
    }
  }

  searchByTag(tag: string): SearchResult[] {
    if (!this.isInitialized || !tag.trim()) return [];
    try {
      return this.searchEngine.searchByTag(tag);
    } catch {
      return [];
    }
  }

  getPostsFromResults(results: SearchResult[]): PostEntry[] {
    const postsMap = new Map(this.allPosts.map((post) => [post.id, post]));
    return results
      .map((result) => postsMap.get(result.id))
      .filter(Boolean) as PostEntry[];
  }

  combinedSearch(
    searchTerm: string,
    activeTag: string,
    maxResults: number = 50,
  ): PostEntry[] {
    let results: SearchResult[] = [];

    if (searchTerm.trim()) {
      results = this.search(searchTerm, maxResults);
      if (activeTag.trim()) {
        results = results.filter((result) =>
          result.keyword_matches.some((keyword: string) =>
            keyword.toLowerCase().includes(activeTag.toLowerCase()),
          ),
        );
      }
    } else if (activeTag.trim()) {
      results = this.searchByTag(activeTag);
    } else {
      return this.allPosts;
    }

    return this.getPostsFromResults(results);
  }

  getStats(): SearchStats {
    if (!this.isInitialized) {
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }
    try {
      return this.searchEngine.getStats();
    } catch {
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }
  }
}

/**
 * Manage search state persistence across page navigation
 */
export class PostSearchState {
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

// Export singleton instance
export const postSearch = new PostSearch();

// Export types for convenience
export type { PostData, SearchResult, SearchStats, PostEntry };

// Export default
export default PostSearch;
