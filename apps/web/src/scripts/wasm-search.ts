import { wasmSearchEngine, type PostData, type SearchResult } from "@lib/wasm";
import type { PostEntry } from "@lib/types";

interface SearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
}

export class WasmPostSearch {
  private searchEngine = wasmSearchEngine;
  private isInitialized = false;
  private allPosts: PostEntry[] = [];
  private currentState: SearchState = {
    searchTerm: "",
    activeTag: "",
    viewAll: false,
  };

  async init(posts: PostEntry[]): Promise<void> {
    try {
      await this.searchEngine.init();
      this.allPosts = posts;

      // Index all posts for WASM search
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
      console.log("WASM search engine initialized with", posts.length, "posts");
    } catch (error) {
      console.error("Failed to initialize WASM search engine:", error);
      throw error;
    }
  }

  /**
   * Perform high-performance search using WASM
   */
  search(query: string, maxResults: number = 50): SearchResult[] {
    if (!this.isInitialized) {
      console.warn("WASM search engine not initialized");
      return [];
    }

    if (!query.trim()) {
      return [];
    }

    try {
      return this.searchEngine.search(query, maxResults);
    } catch (error) {
      console.error("WASM search failed:", error);
      return [];
    }
  }

  /**
   * Search by tag using WASM
   */
  searchByTag(tag: string): SearchResult[] {
    if (!this.isInitialized) {
      console.warn("WASM search engine not initialized");
      return [];
    }

    if (!tag.trim()) {
      return [];
    }

    try {
      return this.searchEngine.searchByTag(tag);
    } catch (error) {
      console.error("WASM tag search failed:", error);
      return [];
    }
  }

  /**
   * Get posts that match search results
   */
  getPostsFromResults(results: SearchResult[]): PostEntry[] {
    const matchedPosts: PostEntry[] = [];

    for (const result of results) {
      const post = this.allPosts.find((p) => p.id === result.id);
      if (post) {
        matchedPosts.push(post);
      }
    }

    return matchedPosts;
  }

  /**
   * Combined search that handles both text and tag filtering
   */
  combinedSearch(
    searchTerm: string,
    activeTag: string,
    maxResults: number = 50,
  ): PostEntry[] {
    let results: SearchResult[] = [];

    // If we have both search term and tag, prioritize search term
    if (searchTerm.trim()) {
      results = this.search(searchTerm, maxResults);

      // Filter results by tag if tag is also specified
      if (activeTag.trim()) {
        results = results.filter((result) =>
          result.keyword_matches.some((keyword) =>
            keyword.toLowerCase().includes(activeTag.toLowerCase()),
          ),
        );
      }
    } else if (activeTag.trim()) {
      results = this.searchByTag(activeTag);
    } else {
      // No search criteria, return all posts
      return this.allPosts;
    }

    return this.getPostsFromResults(results);
  }

  /**
   * Get search engine statistics
   */
  getStats() {
    if (!this.isInitialized) {
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }

    try {
      return this.searchEngine.getStats();
    } catch (error) {
      console.error("Failed to get WASM search stats:", error);
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }
  }

  /**
   * Update search state
   */
  setState(searchTerm: string, activeTag: string, viewAll: boolean): void {
    this.currentState = { searchTerm, activeTag, viewAll };
  }

  /**
   * Get current search state
   */
  getState(): SearchState {
    return { ...this.currentState };
  }

  /**
   * Clear search state
   */
  clearState(): void {
    this.currentState = { searchTerm: "", activeTag: "", viewAll: false };
  }
}

// Global instance
export const wasmPostSearch = new WasmPostSearch();
