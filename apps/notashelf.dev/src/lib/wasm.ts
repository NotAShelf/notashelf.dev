import init, { TextProcessor, SearchEngine } from "wasm-utils";

let wasmModule: TextProcessor | null = null;
let searchEngine: SearchEngine | null = null;
let isInitialized = false;

export async function initWasm(): Promise<{
  textProcessor: TextProcessor;
  searchEngine: SearchEngine;
}> {
  if (!isInitialized) {
    await init();
    wasmModule = new TextProcessor();
    searchEngine = new SearchEngine();
    isInitialized = true;
  }
  return { textProcessor: wasmModule!, searchEngine: searchEngine! };
}

export interface PostData {
  id: string;
  title: string;
  description?: string;
  keywords: string[];
}

export interface SearchResult {
  id: string;
  score: number;
  title_match: boolean;
  description_match: boolean;
  keyword_matches: string[];
  snippet?: string;
}

export interface SearchStats {
  total_posts: number;
  indexed_words: number;
  indexed_keywords: number;
}

export class WasmSearchEngine {
  private engine: SearchEngine | null = null;

  async init(): Promise<void> {
    const { searchEngine } = await initWasm();
    this.engine = searchEngine;
  }

  /**
   * Add a post to the search index for fast searching
   */
  addPost(post: PostData): void {
    if (!this.engine) throw new Error("Search engine not initialized");
    try {
      this.engine.add_post(JSON.stringify(post));
    } catch (e) {
      console.error("Failed to index post", e);
    }
  }

  /**
   * Perform high-performance search across all indexed posts
   */
  search(query: string, maxResults: number = 50): SearchResult[] {
    if (!this.engine) throw new Error("Search engine not initialized");
    const results = this.engine.search(query, maxResults);
    return JSON.parse(results);
  }

  /**
   * Search posts by specific tag/keyword with exact matching
   */
  searchByTag(tag: string): SearchResult[] {
    if (!this.engine) throw new Error("Search engine not initialized");
    const results = this.engine.search_by_tag(tag);
    return JSON.parse(results);
  }

  /**
   * Get statistics about the search index
   */
  getStats(): SearchStats {
    if (!this.engine) throw new Error("Search engine not initialized");
    const stats = this.engine.get_stats();
    return JSON.parse(stats);
  }

  /**
   * Clear all indexed data
   */
  clear(): void {
    if (!this.engine) throw new Error("Search engine not initialized");
    this.engine.clear();
  }
}

export class WasmTextProcessor {
  private processor: TextProcessor | null = null;

  async init(): Promise<void> {
    const { textProcessor } = await initWasm();
    this.processor = textProcessor;
  }

  /**
   * Calculate reading time for blog posts
   */
  calculateReadingTime(text: string, wordsPerMinute: number = 200): number {
    if (!this.processor) throw new Error("WASM module not initialized");
    return this.processor.calculate_reading_time(text, wordsPerMinute);
  }

  /**
   * Extract headings from markdown text
   */
  extractHeadings(markdown: string): string[] {
    if (!this.processor) throw new Error("WASM module not initialized");
    const result = this.processor.extract_headings(markdown);
    return JSON.parse(result);
  }

  /**
   * Generate URL-friendly slug from text
   */
  generateSlug(text: string): string {
    if (!this.processor) throw new Error("WASM module not initialized");
    return this.processor.generate_slug(text);
  }
}

// Singleton instances for global use
export const textProcessor = new WasmTextProcessor();
export const wasmSearchEngine = new WasmSearchEngine();
