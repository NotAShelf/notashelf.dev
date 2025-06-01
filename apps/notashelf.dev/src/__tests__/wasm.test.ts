/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PostEntry } from "@lib/types";

// Mock the WASM library
const mockSearchEngine = {
  init: vi.fn().mockResolvedValue(undefined),
  addPost: vi.fn(),
  search: vi.fn().mockReturnValue([]),
  searchByTag: vi.fn().mockReturnValue([]),
  getStats: vi
    .fn()
    .mockReturnValue({ total_posts: 0, indexed_words: 0, indexed_keywords: 0 }),
  clear: vi.fn(),
};

const mockProjectUtils = {
  init: vi.fn().mockResolvedValue(undefined),
  randomSample: vi.fn().mockReturnValue(JSON.stringify([0, 1, 2])),
  randomRange: vi.fn().mockReturnValue(5),
  shuffleJsonArray: vi.fn().mockReturnValue(JSON.stringify([])),
};

const mockTextProcessor = {
  init: vi.fn().mockResolvedValue(undefined),
  calculateReadingTime: vi.fn().mockReturnValue(5),
  extractHeadings: vi.fn().mockReturnValue([]),
  generateSlug: vi.fn().mockReturnValue("test-slug"),
};

vi.mock("@lib/wasm", () => ({
  wasmSearchEngine: mockSearchEngine,
  wasmProjectUtils: mockProjectUtils,
  textProcessor: mockTextProcessor,
}));

describe("wasm.ts", () => {
  let mockPosts: PostEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset window.__WASM_SUBSYSTEMS__
    if (typeof window !== "undefined") {
      delete (window as any).__WASM_SUBSYSTEMS__;
    }

    // Re-configure mocks after clearing
    mockSearchEngine.init.mockResolvedValue(undefined);
    mockSearchEngine.search.mockReturnValue([]);
    mockSearchEngine.searchByTag.mockReturnValue([]);
    mockSearchEngine.getStats.mockReturnValue({
      total_posts: 0,
      indexed_words: 0,
      indexed_keywords: 0,
    });

    mockProjectUtils.init.mockResolvedValue(undefined);
    mockProjectUtils.randomSample.mockReturnValue(JSON.stringify([0, 1, 2]));
    mockProjectUtils.randomRange.mockReturnValue(5);
    mockProjectUtils.shuffleJsonArray.mockReturnValue(JSON.stringify([]));

    mockTextProcessor.init.mockResolvedValue(undefined);
    mockTextProcessor.calculateReadingTime.mockReturnValue(5);
    mockTextProcessor.extractHeadings.mockReturnValue([]);
    mockTextProcessor.generateSlug.mockReturnValue("test-slug");

    mockPosts = [
      {
        id: "post-1",
        data: {
          title: "Test Post 1",
          description: "Test description 1",
          keywords: ["javascript", "testing"],
          date: new Date("2024-01-01"),
          draft: false,
          archived: false,
        },
      },
      {
        id: "post-2",
        data: {
          title: "Test Post 2",
          description: "Test description 2",
          keywords: ["typescript", "vitest"],
          date: new Date("2024-01-02"),
          draft: false,
          archived: false,
        },
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("WasmPostSearch", () => {
    it("should initialize successfully with posts", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();

      await searchInstance.init(mockPosts);

      expect(mockSearchEngine.init).toHaveBeenCalled();
      expect(mockSearchEngine.clear).toHaveBeenCalled();
      expect(mockSearchEngine.addPost).toHaveBeenCalledTimes(2);
    });

    it("should skip initialization if already initialized", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();

      await searchInstance.init(mockPosts);
      vi.clearAllMocks();

      await searchInstance.init(mockPosts);

      expect(mockSearchEngine.init).not.toHaveBeenCalled();
      expect(mockSearchEngine.addPost).not.toHaveBeenCalled();
    });

    it("should handle initialization errors", async () => {
      mockSearchEngine.init.mockRejectedValueOnce(
        new Error("WASM init failed"),
      );

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();

      await expect(searchInstance.init(mockPosts)).rejects.toThrow(
        "WASM init failed",
      );
    });

    it("should perform search and return results", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 0.8,
          title_match: true,
          description_match: false,
          keyword_matches: [],
        },
      ];
      mockSearchEngine.search.mockReturnValue(mockResults);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.search("test query");

      expect(mockSearchEngine.search).toHaveBeenCalledWith("test query", 50);
      expect(results).toEqual(mockResults);
    });

    it("should return empty results for empty query", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.search("");

      expect(mockSearchEngine.search).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it("should handle search errors gracefully", async () => {
      mockSearchEngine.search.mockImplementation(() => {
        throw new Error("Search failed");
      });

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.search("test");

      expect(results).toEqual([]);
    });

    it("should search by tag", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 1.0,
          title_match: false,
          description_match: false,
          keyword_matches: ["javascript"],
        },
      ];
      mockSearchEngine.searchByTag.mockReturnValue(mockResults);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.searchByTag("javascript");

      expect(mockSearchEngine.searchByTag).toHaveBeenCalledWith("javascript");
      expect(results).toEqual(mockResults);
    });

    it("should handle search by tag with empty tag", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.searchByTag("");

      expect(mockSearchEngine.searchByTag).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it("should handle search by tag errors gracefully", async () => {
      mockSearchEngine.searchByTag.mockImplementation(() => {
        throw new Error("Tag search failed");
      });

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.searchByTag("javascript");

      expect(results).toEqual([]);
    });

    it("should convert search results to posts", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 0.8,
          title_match: true,
          description_match: false,
          keyword_matches: [],
        },
        {
          id: "invalid-id",
          score: 0.5,
          title_match: false,
          description_match: true,
          keyword_matches: [],
        },
      ];

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.getPostsFromResults(mockResults);

      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe("post-1");
    });

    it("should perform combined search with search term only", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 0.8,
          title_match: true,
          description_match: false,
          keyword_matches: [],
        },
      ];
      mockSearchEngine.search.mockReturnValue(mockResults);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.combinedSearch("test", "");

      expect(mockSearchEngine.search).toHaveBeenCalledWith("test", 50);
      expect(posts).toHaveLength(1);
    });

    it("should perform combined search with tag only", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 1.0,
          title_match: false,
          description_match: false,
          keyword_matches: ["javascript"],
        },
      ];
      mockSearchEngine.searchByTag.mockReturnValue(mockResults);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.combinedSearch("", "javascript");

      expect(mockSearchEngine.searchByTag).toHaveBeenCalledWith("javascript");
      expect(posts).toHaveLength(1);
    });

    it("should return all posts when no search criteria", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.combinedSearch("", "");

      expect(posts).toEqual(mockPosts);
    });

    it("should filter search results by tag when both search term and tag provided", async () => {
      const mockResults = [
        {
          id: "post-1",
          score: 0.8,
          title_match: true,
          description_match: false,
          keyword_matches: ["javascript", "testing"],
        },
        {
          id: "post-2",
          score: 0.6,
          title_match: true,
          description_match: false,
          keyword_matches: ["typescript"],
        },
      ];
      mockSearchEngine.search.mockReturnValue(mockResults);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.combinedSearch("test", "javascript");

      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe("post-1");
    });

    it("should get stats when initialized", async () => {
      const mockStats = {
        total_posts: 2,
        indexed_words: 100,
        indexed_keywords: 10,
      };
      mockSearchEngine.getStats.mockReturnValue(mockStats);

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const stats = searchInstance.getStats();

      expect(mockSearchEngine.getStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });

    it("should handle getStats errors gracefully", async () => {
      mockSearchEngine.getStats.mockImplementation(() => {
        throw new Error("Stats failed");
      });

      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();
      await searchInstance.init(mockPosts);

      const stats = searchInstance.getStats();

      expect(stats).toEqual({
        total_posts: 0,
        indexed_words: 0,
        indexed_keywords: 0,
      });
    });

    it("should return default stats when not initialized", async () => {
      const { WasmPostSearch } = await import("../scripts/wasm.ts");
      const searchInstance = new WasmPostSearch();

      const stats = searchInstance.getStats();

      expect(stats).toEqual({
        total_posts: 0,
        indexed_words: 0,
        indexed_keywords: 0,
      });
    });
  });

  describe("WasmFeaturedProjects", () => {
    beforeEach(() => {
      // Setup DOM for project shuffling tests
      document.body.innerHTML = `
        <div id="projects-display">
          <div class="projects-grid">
            <div class="project-card">
              <div class="project-title"><a>Project 1</a></div>
            </div>
            <div class="project-card">
              <div class="project-title"><a>Project 2</a></div>
            </div>
            <div class="project-card">
              <div class="project-title"><a>Project 3</a></div>
            </div>
            <div class="project-card">
              <div class="project-title"><a>Project 4</a></div>
            </div>
          </div>
        </div>
      `;
    });

    it("should initialize successfully", async () => {
      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      await projectsInstance.init();

      expect(mockProjectUtils.init).toHaveBeenCalled();
    });

    it("should skip initialization if already initialized", async () => {
      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      await projectsInstance.init();
      vi.clearAllMocks();

      await projectsInstance.init();

      expect(mockProjectUtils.init).not.toHaveBeenCalled();
    });

    it("should handle initialization errors", async () => {
      mockProjectUtils.init.mockRejectedValueOnce(
        new Error("Project utils init failed"),
      );

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      await expect(projectsInstance.init()).rejects.toThrow(
        "Project utils init failed",
      );
    });

    it("should shuffle projects successfully", async () => {
      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      await projectsInstance.shuffleProjects();

      expect(mockProjectUtils.randomSample).toHaveBeenCalledWith(
        JSON.stringify([0, 1, 2, 3]),
        3,
      );
    });

    it("should setup client side shuffling when DOM is ready", async () => {
      Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
      });

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();
      const shuffleSpy = vi
        .spyOn(projectsInstance, "shuffleProjects")
        .mockResolvedValue();

      await projectsInstance.setupClientSideShuffling();

      expect(shuffleSpy).toHaveBeenCalled();
    });

    it("should wait for DOM content loaded if page is loading", async () => {
      Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
      });

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      await projectsInstance.setupClientSideShuffling();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "DOMContentLoaded",
        expect.any(Function),
      );
    });

    it("should generate random range", async () => {
      mockProjectUtils.randomRange.mockReturnValue(7);

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      const result = await projectsInstance.randomRange(1, 10);

      expect(mockProjectUtils.randomRange).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(7);
    });

    it("should shuffle JSON array", async () => {
      const mockArray = JSON.stringify([1, 2, 3, 4]);
      const mockShuffled = JSON.stringify([3, 1, 4, 2]);
      mockProjectUtils.shuffleJsonArray.mockReturnValue(mockShuffled);

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      const result = await projectsInstance.shuffleJsonArray(mockArray);

      expect(mockProjectUtils.shuffleJsonArray).toHaveBeenCalledWith(mockArray);
      expect(result).toBe(mockShuffled);
    });

    it("should handle shuffle JSON array errors", async () => {
      mockProjectUtils.shuffleJsonArray.mockImplementation(() => {
        throw new Error("Shuffle failed");
      });

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();
      await projectsInstance.init();

      const result = await projectsInstance.shuffleJsonArray("[1,2,3]");

      expect(result).toBe("[1,2,3]"); // Should return original on error
    });

    it("should handle random sample errors", async () => {
      mockProjectUtils.randomSample.mockImplementation(() => {
        throw new Error("Sample failed");
      });

      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();
      await projectsInstance.init();

      const result = await projectsInstance.randomSample("[1,2,3]", 2);

      expect(result).toBe("[1,2,3]"); // Should return original on error
    });

    it("should handle initialization with existing global flag", async () => {
      const { WasmFeaturedProjects } = await import("../scripts/wasm.ts");
      const projectsInstance = new WasmFeaturedProjects();

      await projectsInstance.init();

      expect(mockProjectUtils.init).toHaveBeenCalled();
    });
  });

  describe("WasmTextProcessing", () => {
    it("should initialize successfully", async () => {
      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      await textInstance.init();

      expect(mockTextProcessor.init).toHaveBeenCalled();
    });

    it("should skip initialization if already initialized globally", async () => {
      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      await textInstance.init();
      vi.clearAllMocks();

      await textInstance.init();

      expect(mockTextProcessor.init).not.toHaveBeenCalled();
    });

    it("should calculate reading time", async () => {
      mockTextProcessor.calculateReadingTime.mockReturnValue(3);

      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      const result = await textInstance.calculateReadingTime("Some text", 250);

      expect(mockTextProcessor.calculateReadingTime).toHaveBeenCalledWith(
        "Some text",
        250,
      );
      expect(result).toBe(3);
    });

    it("should extract headings", async () => {
      const mockHeadings = ["# Heading 1", "## Heading 2"];
      mockTextProcessor.extractHeadings.mockReturnValue(mockHeadings);

      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      const result = await textInstance.extractHeadings(
        "# Heading 1\n## Heading 2",
      );

      expect(mockTextProcessor.extractHeadings).toHaveBeenCalledWith(
        "# Heading 1\n## Heading 2",
      );
      expect(result).toEqual(mockHeadings);
    });

    it("should generate slug", async () => {
      mockTextProcessor.generateSlug.mockReturnValue("hello-world");

      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      const result = await textInstance.generateSlug("Hello World!");

      expect(mockTextProcessor.generateSlug).toHaveBeenCalledWith(
        "Hello World!",
      );
      expect(result).toBe("hello-world");
    });

    it("should handle initialization errors", async () => {
      mockTextProcessor.init.mockRejectedValueOnce(
        new Error("Text processor init failed"),
      );

      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      await expect(textInstance.init()).rejects.toThrow(
        "Text processor init failed",
      );
    });

    it("should handle text processing with proper initialization sequence", async () => {
      const { WasmTextProcessing } = await import("../scripts/wasm.ts");
      const textInstance = new WasmTextProcessing();

      // Ensure not initialized initially
      expect(textInstance["isInitialized"]).toBe(false);

      await textInstance.init();

      expect(textInstance["isInitialized"]).toBe(true);
      expect(mockTextProcessor.init).toHaveBeenCalled();
    });
  });

  describe("Singleton instances", () => {
    it("should export singleton instances", async () => {
      const module = await import("../scripts/wasm.ts");

      expect(module.wasmPostSearch).toBeDefined();
      expect(module.wasmFeaturedProjects).toBeDefined();
      expect(module.wasmTextProcessing).toBeDefined();
    });

    it("should export legacy aliases", async () => {
      const module = await import("../scripts/wasm.ts");

      expect(module.wasmSearch).toBe(module.wasmPostSearch);
      expect(module.wasmProjects).toBe(module.wasmFeaturedProjects);
    });
  });
});
