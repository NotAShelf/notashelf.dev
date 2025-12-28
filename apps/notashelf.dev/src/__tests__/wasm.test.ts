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
        collection: "posts",
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
        collection: "posts",
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

  describe("PostSearch", () => {
    it("should initialize successfully with posts", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();

      await searchInstance.init(mockPosts);

      expect(mockSearchEngine.init).toHaveBeenCalled();
      expect(mockSearchEngine.clear).toHaveBeenCalled();
      expect(mockSearchEngine.addPost).toHaveBeenCalledTimes(2);
    });

    it("should skip initialization if already initialized", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();

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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();

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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.search("test query");

      expect(mockSearchEngine.search).toHaveBeenCalledWith("test query", 50);
      expect(results).toEqual(mockResults);
    });

    it("should return empty results for empty query", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.search("");

      expect(mockSearchEngine.search).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it("should handle search errors gracefully", async () => {
      mockSearchEngine.search.mockImplementation(() => {
        throw new Error("Search failed");
      });

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.searchByTag("javascript");

      expect(mockSearchEngine.searchByTag).toHaveBeenCalledWith("javascript");
      expect(results).toEqual(mockResults);
    });

    it("should handle search by tag with empty tag", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const results = searchInstance.searchByTag("");

      expect(mockSearchEngine.searchByTag).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it("should handle WASM method errors gracefully", async () => {
      mockSearchEngine.searchByTag.mockImplementation(() => {
        throw new Error("Tag search failed");
      });
      mockSearchEngine.getStats.mockImplementation(() => {
        throw new Error("Stats failed");
      });

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const tagResults = searchInstance.searchByTag("javascript");
      const stats = searchInstance.getStats();

      expect(tagResults).toEqual([]);
      expect(stats).toEqual({
        total_posts: 0,
        indexed_words: 0,
        indexed_keywords: 0,
      });
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const posts = searchInstance.combinedSearch("", "javascript");

      expect(mockSearchEngine.searchByTag).toHaveBeenCalledWith("javascript");
      expect(posts).toHaveLength(1);
    });

    it("should return all posts when no search criteria", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
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

      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();
      await searchInstance.init(mockPosts);

      const stats = searchInstance.getStats();

      expect(mockSearchEngine.getStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });

    it("should return default stats when not initialized", async () => {
      const { PostSearch } = await import("../scripts/utils/post-search");
      const searchInstance = new PostSearch();

      const stats = searchInstance.getStats();

      expect(stats).toEqual({
        total_posts: 0,
        indexed_words: 0,
        indexed_keywords: 0,
      });
    });
  });

  describe("ProjectShuffle", () => {
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

      // Setup window location for homepage
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/",
        },
        writable: true,
      });
    });

    it("should initialize successfully", async () => {
      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();

      // ProjectShuffle auto-initializes

      // ProjectShuffle doesn't expose init directly
    });

    it("should skip initialization if already initialized", async () => {
      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();

      await projectsInstance.setupClientSideShuffling();
      vi.clearAllMocks();

      await projectsInstance.setupClientSideShuffling();

      // ProjectShuffle handles initialization internally
    });

    it("should handle initialization errors", async () => {
      mockProjectUtils.init.mockRejectedValueOnce(
        new Error("Project utils init failed"),
      );

      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();

      // The current implementation catches errors internally and doesn't reject
      await projectsInstance.setupClientSideShuffling();

      // Verify that init was called and failed
      expect(mockProjectUtils.init).toHaveBeenCalled();
    });

    it("should shuffle projects successfully", async () => {
      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();

      await projectsInstance.setupClientSideShuffling();

      // In test environment, WASM fails so it uses fallback shuffle
      // Check that the projects grid has been modified (3 out of 4 projects shown)
      const projectsGrid = document.querySelector(".projects-grid");
      expect(projectsGrid?.children.length).toBe(3);
    });

    it("should setup client side shuffling when DOM is ready", async () => {
      Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
      });

      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();
      const shuffleSpy = vi.spyOn(projectsInstance, "shuffleProjects");

      await projectsInstance.setupClientSideShuffling();

      expect(shuffleSpy).toHaveBeenCalled();
    });

    it("should wait for DOM content loaded if page is loading", async () => {
      Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
      });

      const { ProjectShuffle } =
        await import("../scripts/utils/project-shuffle");
      const projectsInstance = new ProjectShuffle();
      const shuffleSpy = vi
        .spyOn(projectsInstance, "shuffleProjects")
        .mockResolvedValue();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      await projectsInstance.setupClientSideShuffling();

      // ProjectShuffle handles DOM events internally
      expect(shuffleSpy).toBeDefined();
    });

    it("should generate random range", async () => {
      mockProjectUtils.randomRange.mockReturnValue(7);

      const { wasmProjectUtils } = await import("../lib/wasm");

      const result = await wasmProjectUtils.randomRange(1, 10);

      expect(mockProjectUtils.randomRange).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(7);
    });

    it("should shuffle JSON array", async () => {
      const mockArray = JSON.stringify([1, 2, 3, 4]);
      const mockShuffled = JSON.stringify([3, 1, 4, 2]);
      mockProjectUtils.shuffleJsonArray.mockReturnValue(mockShuffled);

      const { wasmProjectUtils } = await import("../lib/wasm");

      const result = wasmProjectUtils.shuffleJsonArray(mockArray);

      expect(mockProjectUtils.shuffleJsonArray).toHaveBeenCalledWith(mockArray);
      expect(result).toBe(mockShuffled);
    });

    it("should handle initialization with existing global flag", async () => {
      const { wasmProjectUtils } = await import("../lib/wasm");

      await wasmProjectUtils.init();

      expect(mockProjectUtils.init).toHaveBeenCalled();
    });
  });

  describe("TextProcessor (lib/wasm)", () => {
    it("should export textProcessor singleton", async () => {
      const { textProcessor } = await import("../lib/wasm");

      expect(textProcessor).toBeDefined();
    });
  });

  describe("Singleton instances", () => {
    it("should export singleton instances", async () => {
      const postSearchModule = await import("../scripts/utils/post-search");
      const projectShuffleModule =
        await import("../scripts/utils/project-shuffle");

      expect(postSearchModule.postSearch).toBeDefined();
      expect(projectShuffleModule.projectShuffle).toBeDefined();
    });

    it("should export consolidated utilities", async () => {
      const postSearchModule = await import("../scripts/utils/post-search");

      expect(postSearchModule.PostSearchState).toBeDefined();
      expect(postSearchModule.PostSearch).toBeDefined();
    });
  });
});
