import {
  wasmSearchEngine,
  wasmProjectUtils,
  textProcessor as wasmTextProcessor,
  type PostData,
  type SearchResult,
  type SearchStats,
} from "@lib/wasm";
import type { PostEntry } from "@lib/types";

export type { PostData, SearchResult, SearchStats, PostEntry };

export interface SearchState {
  searchTerm: string;
  activeTag: string;
  viewAll: boolean;
}

export class WasmPostSearch {
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
}

export class WasmFeaturedProjects {
  private projectUtils = wasmProjectUtils;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.projectUtils.init();
    this.isInitialized = true;
  }

  async shuffleProjects(): Promise<void> {
    // Featured projects (homepage)
    const projectsGrid = document.querySelector(".projects-grid");
    if (projectsGrid) {
      await this.shuffleFeaturedProjects(projectsGrid);
      return;
    }

    // Recent projects (about page)
    const recentContainer = document.querySelector(
      ".recent-projects-container",
    );
    if (recentContainer) {
      await this.shuffleRecentProjects(recentContainer);
      return;
    }
  }

  private async shuffleFeaturedProjects(projectsGrid: Element): Promise<void> {
    const projectCards = Array.from(projectsGrid.children);
    if (projectCards.length <= 3) return;

    try {
      if (!this.isInitialized) await this.init();

      const selectedIndices = this.projectUtils.randomSample(
        JSON.stringify(
          Array.from({ length: projectCards.length }, (_, i) => i),
        ),
        3,
      );
      const parsedIndices = JSON.parse(selectedIndices) as number[];

      const selectedCards = parsedIndices
        .map((index) => projectCards[index])
        .filter(Boolean) as Element[];

      // Remove all cards from the grid
      while (projectsGrid.firstChild) {
        projectsGrid.removeChild(projectsGrid.firstChild);
      }

      // Append only the selected cards
      selectedCards.forEach((card) => {
        projectsGrid.appendChild(card);
      });
    } catch (error) {
      console.warn("WASM shuffling failed, using fallback:", error);
      // Simple fallback without WASM
      const indices = Array.from({ length: projectCards.length }, (_, i) => i);
      const shuffled = indices.sort(() => Math.random() - 0.5);
      const selectedIndices = shuffled.slice(0, 3);

      const selectedCards = selectedIndices
        .map((index) => projectCards[index])
        .filter(Boolean) as Element[];

      // Remove all cards from the grid
      while (projectsGrid.firstChild) {
        projectsGrid.removeChild(projectsGrid.firstChild);
      }

      // Append only the selected cards
      selectedCards.forEach((card) => {
        projectsGrid.appendChild(card);
      });
    }
  }

  private async shuffleRecentProjects(recentContainer: Element): Promise<void> {
    const topRow = recentContainer.querySelector(".top-row");
    const bottomRow = recentContainer.querySelector(".bottom-row");

    if (!topRow || !bottomRow) return;

    // Collect all project cards from both rows
    const allCards = [
      ...Array.from(topRow.children),
      ...Array.from(bottomRow.children),
    ];

    if (allCards.length <= 5) return;

    try {
      if (!this.isInitialized) await this.init();

      const selectedIndices = this.projectUtils.randomSample(
        JSON.stringify(Array.from({ length: allCards.length }, (_, i) => i)),
        5,
      );
      const parsedIndices = JSON.parse(selectedIndices) as number[];

      const selectedCards = parsedIndices
        .map((index) => allCards[index])
        .filter(Boolean) as Element[];

      // Clear both rows
      while (topRow.firstChild) {
        topRow.removeChild(topRow.firstChild);
      }
      while (bottomRow.firstChild) {
        bottomRow.removeChild(bottomRow.firstChild);
      }

      // Redistribute: first 3 cards to top row, remaining to bottom row
      selectedCards.slice(0, 3).forEach((card) => {
        topRow.appendChild(card);
      });
      selectedCards.slice(3).forEach((card) => {
        bottomRow.appendChild(card);
      });
    } catch (error) {
      console.warn(
        "WASM shuffling failed, using fallback for recent projects:",
        error,
      );
      // Simple fallback without WASM
      const indices = Array.from({ length: allCards.length }, (_, i) => i);
      const shuffled = indices.sort(() => Math.random() - 0.5);
      const selectedIndices = shuffled.slice(0, 5);

      const selectedCards = selectedIndices
        .map((index) => allCards[index])
        .filter(Boolean) as Element[];

      // Clear both rows
      while (topRow.firstChild) {
        topRow.removeChild(topRow.firstChild);
      }
      while (bottomRow.firstChild) {
        bottomRow.removeChild(bottomRow.firstChild);
      }

      // Redistribute: first 3 cards to top row, remaining to bottom row
      selectedCards.slice(0, 3).forEach((card) => {
        topRow.appendChild(card);
      });
      selectedCards.slice(3).forEach((card) => {
        bottomRow.appendChild(card);
      });
    }
  }

  async setupClientSideShuffling(): Promise<void> {
    const shuffle = () => {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        this.shuffleProjects().catch((error) => {
          console.error("Failed to shuffle projects:", error);
        });
      }, 100);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", shuffle);
    } else {
      shuffle();
    }
  }

  async randomRange(min: number, max: number): Promise<number> {
    if (!this.isInitialized) await this.init();
    return this.projectUtils.randomRange(min, max);
  }

  async shuffleJsonArray(jsonArray: string): Promise<string> {
    if (!this.isInitialized) await this.init();
    try {
      return this.projectUtils.shuffleJsonArray(jsonArray);
    } catch {
      return jsonArray;
    }
  }

  async randomSample(jsonArray: string, count: number): Promise<string> {
    if (!this.isInitialized) await this.init();
    try {
      return this.projectUtils.randomSample(jsonArray, count);
    } catch {
      return jsonArray;
    }
  }
}

export class WasmTextProcessing {
  private textProcessor = wasmTextProcessor;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.textProcessor.init();
    this.isInitialized = true;
  }

  async calculateReadingTime(
    text: string,
    wordsPerMinute: number = 200,
  ): Promise<number> {
    if (!this.isInitialized) await this.init();
    return this.textProcessor.calculateReadingTime(text, wordsPerMinute);
  }

  async extractHeadings(markdown: string): Promise<string[]> {
    if (!this.isInitialized) await this.init();
    return this.textProcessor.extractHeadings(markdown);
  }

  async generateSlug(text: string): Promise<string> {
    if (!this.isInitialized) await this.init();
    return this.textProcessor.generateSlug(text);
  }
}

export const wasmPostSearch = new WasmPostSearch();
export const wasmFeaturedProjects = new WasmFeaturedProjects();
export const wasmTextProcessing = new WasmTextProcessing();

export { wasmPostSearch as wasmSearch };
export { wasmFeaturedProjects as wasmProjects };
