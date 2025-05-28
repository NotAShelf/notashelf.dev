// Dynamic imports for better code splitting
let searchEngine: any = null;
let internalTextProcessor: any = null;
let projectUtils: any = null;
let isInitialized = false;

// Use a global flag to persist across page navigation
declare global {
  interface Window {
    __WASM_INITIALIZED__?: boolean;
  }
}

// Shared promise to track the initialization process
let initializationPromise: Promise<{
  textProcessor: any;
  searchEngine: any;
  projectUtils: any;
}> | null = null;

export async function initWasm(): Promise<{
  textProcessor: any;
  searchEngine: any;
  projectUtils: any;
}> {
  // Check both local and global initialization state
  if (
    isInitialized ||
    (typeof window !== "undefined" && window.__WASM_INITIALIZED__)
  ) {
    // Ensure static variables are actually initialized before returning them
    if (internalTextProcessor && searchEngine && projectUtils) {
      if (!isInitialized) {
        console.log("WASM modules already initialized globally");
        isInitialized = true;
      }
      return {
        textProcessor: internalTextProcessor,
        searchEngine: searchEngine,
        projectUtils: projectUtils,
      };
    } else {
      // Reset global flag if static variables are null to force proper initialization
      if (typeof window !== "undefined") {
        window.__WASM_INITIALIZED__ = false;
      }
      isInitialized = false;
    }
  }

  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization and store the promise
  initializationPromise = (async () => {
    try {
      console.log("Attempting to import wasm-utils module...");
      // Lazy load WASM module only when needed
      const wasmModule = await import("wasm-utils");
      console.log("WASM module imported successfully:", wasmModule);

      console.log("Initializing WASM module...");
      await wasmModule.default();
      console.log("WASM module initialized");

      console.log(
        "Creating TextProcessor, SearchEngine, and ProjectUtils instances...",
      );
      internalTextProcessor = new wasmModule.TextProcessor();
      searchEngine = new wasmModule.SearchEngine();
      projectUtils = new wasmModule.ProjectUtils();
      console.log("WASM instances created successfully");

      isInitialized = true;
      // Set global flag to persist across page navigation
      if (typeof window !== "undefined") {
        window.__WASM_INITIALIZED__ = true;
      }
      console.log("WASM modules loaded successfully");

      return {
        textProcessor: internalTextProcessor!,
        searchEngine: searchEngine!,
        projectUtils: projectUtils!,
      };
    } catch (error) {
      // Reset initialization promise on error to allow retry
      initializationPromise = null;

      console.error("Failed to load WASM modules:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });
      throw error;
    }
  })();

  return initializationPromise;
}

// Check if WASM is supported
export function isWasmSupported(): boolean {
  try {
    if (
      typeof WebAssembly === "object" &&
      typeof WebAssembly.instantiate === "function"
    ) {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
      );
      return module instanceof WebAssembly.Module;
    }
  } catch {
    // Ignore
  }
  return false;
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
  private engine: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Check WASM support before loading
    if (!isWasmSupported()) {
      throw new Error("WebAssembly not supported in this browser");
    }

    try {
      const { searchEngine } = await initWasm();
      this.engine = searchEngine;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize WASM search engine:", error);
      throw error;
    }
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
    try {
      const results = this.engine.search(query, maxResults);
      return JSON.parse(results);
    } catch (e) {
      console.error("Failed to parse search results:", e);
      return [];
    }
  }

  /**
   * Search posts by specific tag/keyword with exact matching
   */
  searchByTag(tag: string): SearchResult[] {
    if (!this.engine) throw new Error("Search engine not initialized");
    try {
      const results = this.engine.search_by_tag(tag);
      return JSON.parse(results);
    } catch (e) {
      console.error("Failed to parse tag search results:", e);
      return [];
    }
  }

  /**
   * Get statistics about the search index
   */
  getStats(): SearchStats {
    if (!this.engine) throw new Error("Search engine not initialized");
    try {
      const stats = this.engine.get_stats();
      return JSON.parse(stats);
    } catch (e) {
      console.error("Failed to parse search stats:", e);
      return {
        total_posts: 0,
        indexed_words: 0,
        indexed_keywords: 0,
      };
    }
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
  private processor: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Check WASM support before loading
    if (!isWasmSupported()) {
      throw new Error("WebAssembly not supported in this browser");
    }

    try {
      const { textProcessor } = await initWasm();
      this.processor = textProcessor;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize WASM text processor:", error);
      throw error;
    }
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
    try {
      const result = this.processor.extract_headings(markdown);
      return JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse extracted headings:", e);
      return [];
    }
  }

  /**
   * Generate URL-friendly slug from text
   */
  generateSlug(text: string): string {
    if (!this.processor) throw new Error("WASM module not initialized");
    return this.processor.generate_slug(text);
  }
}

export class WasmProjectUtils {
  private projectUtils: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Check WASM support before loading
    if (!isWasmSupported()) {
      throw new Error("WebAssembly not supported in this browser");
    }

    try {
      const { projectUtils } = await initWasm();
      this.projectUtils = projectUtils;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize WASM project utils:", error);
      throw error;
    }
  }

  /**
   * Shuffle an array of indices using Fisher-Yates algorithm
   */
  shuffleIndices(length: number): number[] {
    if (!this.projectUtils) throw new Error("WASM module not initialized");
    return this.projectUtils.shuffle_indices(length);
  }

  /**
   * Shuffle a JSON array and return the shuffled array
   * Returns the original input if an error occurs
   */
  shuffleJsonArray(jsonArray: string): string {
    if (!this.projectUtils) throw new Error("WASM module not initialized");
    try {
      return this.projectUtils.shuffle_json_array(jsonArray);
    } catch (e) {
      console.warn("Failed to shuffle JSON array:", e);
      return jsonArray; // Return original input on error
    }
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  randomRange(min: number, max: number): number {
    if (!this.projectUtils) throw new Error("WASM module not initialized");
    return this.projectUtils.random_range(min, max);
  }

  /**
   * Pick random elements from an array without replacement
   * Returns the original input if an error occurs
   */
  randomSample(jsonArray: string, count: number): string {
    if (!this.projectUtils) throw new Error("WASM module not initialized");
    try {
      return this.projectUtils.random_sample(jsonArray, count);
    } catch (e) {
      console.warn("Failed to sample from JSON array:", e);
      return jsonArray; // Return original input on error
    }
  }
}

// Singleton instances for global use
export const textProcessor = new WasmTextProcessor();
export const wasmSearchEngine = new WasmSearchEngine();
export const wasmProjectUtils = new WasmProjectUtils();
