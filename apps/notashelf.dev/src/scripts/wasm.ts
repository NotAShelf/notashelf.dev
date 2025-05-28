// Unified WASM module that consolidates all WASM-related functionality
import {
  wasmSearchEngine,
  wasmProjectUtils,
  textProcessor as wasmTextProcessor,
  type PostData,
  type SearchResult,
  type SearchStats,
} from "@lib/wasm";
import type { PostEntry } from "@lib/types";

// Global interface for WASM initialization state
declare global {
  interface Window {
    __WASM_SUBSYSTEMS__?: {
      search?: boolean;
      projects?: boolean;
      textProcessing?: boolean;
    };
  }
}

// Re-export types for convenience
export type { PostData, SearchResult, SearchStats, PostEntry };

/**
 * Search state interface for consistent state management
 */
export interface SearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
}

/**
 * Unified WASM Post Search functionality
 * Consolidates search logic from wasm-search.ts
 */
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
    // Check if either this instance or the global flag indicates initialization
    if (
      this.isInitialized ||
      (typeof window !== "undefined" && window.__WASM_SUBSYSTEMS__?.search)
    ) {
      console.log("WASM search engine already initialized");
      return;
    }

    try {
      await this.searchEngine.init();

      // Clear existing index to prevent duplicates if re-initializing
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

      // Set module-specific flag to prevent re-initialization
      if (typeof window !== "undefined") {
        if (!window.__WASM_SUBSYSTEMS__) {
          window.__WASM_SUBSYSTEMS__ = {};
        }
        window.__WASM_SUBSYSTEMS__.search = true;
      }

      console.log("WASM search engine initialized successfully");
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
    // XXX: Map for O(1) lookups instead of O(n) find operations
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

/**
 * Unified WASM Featured Projects functionality
 * Consolidates project shuffling logic from wasm-featured-projects.ts
 */
export class WasmFeaturedProjects {
  private projectUtils = wasmProjectUtils;
  private isInitialized = false;

  async init(): Promise<void> {
    // If already initialized, return early
    if (this.isInitialized) {
      console.log("WASM featured projects already initialized");
      return;
    }

    try {
      // Always ensure projectUtils is initialized for this instance
      await this.projectUtils.init();
      this.isInitialized = true;

      // Check module-specific initialization state and log appropriately
      if (
        typeof window !== "undefined" &&
        window.__WASM_SUBSYSTEMS__?.projects
      ) {
        console.log(
          "WASM featured projects using existing module initialization",
        );
      } else {
        // Set module-specific flag to prevent re-initialization in other instances
        if (typeof window !== "undefined") {
          if (!window.__WASM_SUBSYSTEMS__) {
            window.__WASM_SUBSYSTEMS__ = {};
          }
          window.__WASM_SUBSYSTEMS__.projects = true;
        }
        console.log("WASM featured projects initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize WASM featured projects:", error);
      throw error;
    }
  }

  /**
   * Select and display 3 random projects from the full pool of projects
   * Only applies to featured mode (grid layout), not recent mode
   */
  async shuffleProjects(): Promise<void> {
    try {
      // Ensure WASM is initialized
      if (!this.isInitialized) {
        await this.init();
      }

      // Only shuffle featured projects mode
      const projectsDisplay = document.getElementById("projects-display");
      if (!projectsDisplay) {
        console.warn("Projects display container not found");
        return;
      }

      // Check if this is featured mode by looking for the grid layout
      const projectsGrid = projectsDisplay.querySelector(".projects-grid");
      if (!projectsGrid) {
        console.log(
          "Not in featured mode (grid layout not found), skipping shuffle",
        );
        return; // This is recent mode, don't shuffle
      }

      // Get all project cards
      const projectCards = Array.from(projectsGrid.children);
      if (projectCards.length <= 3) {
        console.log(
          "Not enough project cards to randomly select from (count:",
          projectCards.length,
          "), showing all",
        );
        return; // If 3 or fewer projects, show them all
      }

      console.log(
        "Selecting 3 random projects from",
        projectCards.length,
        "available projects",
      );

      // Get 3 random indices from WASM without replacement
      const selectedIndices = this.projectUtils.randomSample(
        JSON.stringify(
          Array.from({ length: projectCards.length }, (_, i) => i),
        ),
        3,
      );
      const parsedIndices = JSON.parse(selectedIndices) as number[];

      // Store original titles for debugging
      const allTitles = projectCards.map((card) => {
        const titleElement = card.querySelector(".project-title a");
        return titleElement ? titleElement.textContent : "Unknown";
      });

      // Get the selected cards (existing nodes, not clones)
      const selectedCards = parsedIndices
        .map((index) => projectCards[index])
        .filter(Boolean) as Element[];

      // Hide all cards first
      projectCards.forEach((card) => {
        (card as HTMLElement).style.display = "none";
      });

      // Show only the selected cards and move them to the front
      selectedCards.forEach((card) => {
        (card as HTMLElement).style.display = "";
        // Move selected cards to the beginning of the grid
        if (projectsGrid.firstChild) {
          projectsGrid.insertBefore(card, projectsGrid.firstChild);
        } else {
          projectsGrid.appendChild(card);
        }
      });

      // Force reflow to ensure changes are applied
      void (projectsGrid as HTMLElement).offsetHeight;

      // Debug: show the selection
      const selectedTitles = selectedCards.map((card) => {
        const titleElement = card.querySelector(".project-title a");
        return titleElement ? titleElement.textContent : "Unknown";
      });

      console.log(
        "Projects randomly selected successfully:",
        "\nAvailable projects:",
        allTitles,
        "\nSelected projects:",
        selectedTitles,
        "\nUsing indices:",
        parsedIndices,
      );
    } catch (error) {
      console.warn("Failed to randomly select projects on client:", error);
      // Fail silently - the page still works with all projects showing
    }
  }

  /**
   * Initialize and shuffle projects when DOM is ready
   */
  async setupClientSideShuffling(): Promise<void> {
    // Run after the page loads
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.shuffleProjects(),
      );
    } else {
      await this.shuffleProjects();
    }
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  async randomRange(min: number, max: number): Promise<number> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.projectUtils.randomRange(min, max);
  }

  /**
   * Shuffle a JSON array and return the shuffled array
   * Returns the original input if an error occurs
   */
  async shuffleJsonArray(jsonArray: string): Promise<string> {
    if (!this.isInitialized) {
      await this.init();
    }
    try {
      return this.projectUtils.shuffleJsonArray(jsonArray);
    } catch (e) {
      console.warn("Failed to shuffle JSON array:", e);
      return jsonArray; // Return original input on error
    }
  }

  /**
   * Pick random elements from an array without replacement
   * Returns the original input if an error occurs
   */
  async randomSample(jsonArray: string, count: number): Promise<string> {
    if (!this.isInitialized) {
      await this.init();
    }
    try {
      return this.projectUtils.randomSample(jsonArray, count);
    } catch (e) {
      console.warn("Failed to sample from JSON array:", e);
      return jsonArray; // Return original input on error
    }
  }
}

/**
 * Unified WASM Text Processing functionality
 * Consolidates text processing utilities
 */
export class WasmTextProcessing {
  private textProcessor = wasmTextProcessor;
  private isInitialized = false;

  async init(): Promise<void> {
    // Check module-specific initialization state first
    if (
      typeof window !== "undefined" &&
      window.__WASM_SUBSYSTEMS__?.textProcessing &&
      this.isInitialized
    ) {
      console.log("WASM text processing already initialized globally");
      return;
    }

    if (this.isInitialized) return;

    try {
      await this.textProcessor.init();
      this.isInitialized = true;

      // Set module-specific flag to prevent re-initialization
      if (typeof window !== "undefined") {
        if (!window.__WASM_SUBSYSTEMS__) {
          window.__WASM_SUBSYSTEMS__ = {};
        }
        window.__WASM_SUBSYSTEMS__.textProcessing = true;
      }

      console.log("WASM text processing initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WASM text processor:", error);
      throw error;
    }
  }

  /**
   * Calculate reading time for blog posts
   */
  async calculateReadingTime(
    text: string,
    wordsPerMinute: number = 200,
  ): Promise<number> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.textProcessor.calculateReadingTime(text, wordsPerMinute);
  }

  /**
   * Extract headings from markdown text
   */
  async extractHeadings(markdown: string): Promise<string[]> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.textProcessor.extractHeadings(markdown);
  }

  /**
   * Generate URL-friendly slug from text
   */
  async generateSlug(text: string): Promise<string> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.textProcessor.generateSlug(text);
  }
}

// Singleton instances for global use
export const wasmPostSearch = new WasmPostSearch();
export const wasmFeaturedProjects = new WasmFeaturedProjects();
export const wasmTextProcessing = new WasmTextProcessing();

// Legacy exports for backward compatibility
export { wasmPostSearch as wasmSearch };
export { wasmFeaturedProjects as wasmProjects };
