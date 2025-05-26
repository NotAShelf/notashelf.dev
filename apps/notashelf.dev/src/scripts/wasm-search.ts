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
    } catch (error) {
      console.error("WASM search initialization failed");
      throw error;
    }
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
    return results
      .map((result) => this.allPosts.find((p) => p.id === result.id))
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
          result.keyword_matches.some((keyword) =>
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

  getStats() {
    if (!this.isInitialized) {
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }
    try {
      return this.searchEngine.getStats();
    } catch {
      return { total_posts: 0, indexed_words: 0, indexed_keywords: 0 };
    }
  }

  setState(searchTerm: string, activeTag: string, viewAll: boolean): void {
    this.currentState = { searchTerm, activeTag, viewAll };
  }

  getState(): SearchState {
    return { ...this.currentState };
  }

  clearState(): void {
    this.currentState = { searchTerm: "", activeTag: "", viewAll: false };
  }
}

export const wasmPostSearch = new WasmPostSearch();
