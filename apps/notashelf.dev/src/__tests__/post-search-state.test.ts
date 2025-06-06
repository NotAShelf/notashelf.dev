/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import PostSearchState from "../scripts/post-search-state";

describe("PostSearchState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage mock
    sessionStorage.clear();
  });

  describe("setSearchState", () => {
    it("should save search state to sessionStorage", () => {
      const mockSetItem = vi.spyOn(sessionStorage, "setItem");

      PostSearchState.setSearchState("test query", "javascript", true);

      expect(mockSetItem).toHaveBeenCalledWith(
        "post-search-state",
        JSON.stringify({
          searchTerm: "test query",
          activeTag: "javascript",
          viewAll: true,
        }),
      );
    });

    it("should handle sessionStorage errors gracefully", () => {
      const mockSetItem = vi
        .spyOn(sessionStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      PostSearchState.setSearchState("test", "tag", false);

      expect(mockSetItem).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save search state:",
        expect.any(Error),
      );
    });
  });

  describe("getSearchState", () => {
    it("should return saved search state from sessionStorage", () => {
      const testState = {
        searchTerm: "react",
        activeTag: "frontend",
        viewAll: false,
      };

      vi.spyOn(sessionStorage, "getItem").mockReturnValue(
        JSON.stringify(testState),
      );

      const result = PostSearchState.getSearchState();

      expect(result).toEqual(testState);
    });

    it("should return default state when no saved state exists", () => {
      vi.spyOn(sessionStorage, "getItem").mockReturnValue(null);

      const result = PostSearchState.getSearchState();

      expect(result).toEqual({
        searchTerm: "",
        activeTag: "",
        viewAll: false,
      });
    });

    it("should return default state when saved state is invalid JSON", () => {
      vi.spyOn(sessionStorage, "getItem").mockReturnValue("invalid json");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = PostSearchState.getSearchState();

      expect(result).toEqual({
        searchTerm: "",
        activeTag: "",
        viewAll: false,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to retrieve search state:",
        expect.any(Error),
      );
    });

    it("should return default state when saved state has invalid structure", () => {
      const invalidState = { searchTerm: "test", invalidField: true };
      vi.spyOn(sessionStorage, "getItem").mockReturnValue(
        JSON.stringify(invalidState),
      );
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = PostSearchState.getSearchState();

      expect(result).toEqual({
        searchTerm: "",
        activeTag: "",
        viewAll: false,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid search state format in sessionStorage",
      );
    });

    it("should handle sessionStorage access errors", () => {
      vi.spyOn(sessionStorage, "getItem").mockImplementation(() => {
        throw new Error("Storage access denied");
      });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = PostSearchState.getSearchState();

      expect(result).toEqual({
        searchTerm: "",
        activeTag: "",
        viewAll: false,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to retrieve search state:",
        expect.any(Error),
      );
    });
  });

  describe("clearSearchState", () => {
    it("should remove search state from sessionStorage", () => {
      const mockRemoveItem = vi.spyOn(sessionStorage, "removeItem");

      PostSearchState.clearSearchState();

      expect(mockRemoveItem).toHaveBeenCalledWith("post-search-state");
    });

    it("should handle sessionStorage errors gracefully", () => {
      const mockRemoveItem = vi
        .spyOn(sessionStorage, "removeItem")
        .mockImplementation(() => {
          throw new Error("Storage access error");
        });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      PostSearchState.clearSearchState();

      expect(mockRemoveItem).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to clear search state:",
        expect.any(Error),
      );
    });
  });

  describe("browser environment detection", () => {
    it("should work in browser environment", () => {
      // Default happy-dom environment should be detected as browser
      const mockSetItem = vi.spyOn(sessionStorage, "setItem");

      PostSearchState.setSearchState("test", "tag", false);

      expect(mockSetItem).toHaveBeenCalled();
    });

    it("should not attempt operations in non-browser environment", () => {
      // Mock non-browser environment by mocking window and sessionStorage
      const originalWindow = global.window;
      const originalSessionStorage = global.sessionStorage;

      // @ts-ignore
      delete global.window;
      // @ts-ignore
      delete global.sessionStorage;

      const mockSetItem = vi.fn();
      const mockGetItem = vi.fn();
      const mockRemoveItem = vi.fn();

      // Test setSearchState
      PostSearchState.setSearchState("test", "tag", false);
      expect(mockSetItem).not.toHaveBeenCalled();

      // Test getSearchState
      const result = PostSearchState.getSearchState();
      expect(mockGetItem).not.toHaveBeenCalled();
      expect(result).toEqual({
        searchTerm: "",
        activeTag: "",
        viewAll: false,
      });

      // Test clearSearchState
      PostSearchState.clearSearchState();
      expect(mockRemoveItem).not.toHaveBeenCalled();

      // Restore original environment
      global.window = originalWindow;
      global.sessionStorage = originalSessionStorage;
    });
  });

  describe("type validation", () => {
    it("should validate correct SearchState objects", () => {
      const validState = {
        searchTerm: "test",
        activeTag: "typescript",
        viewAll: true,
      };

      vi.spyOn(sessionStorage, "getItem").mockReturnValue(
        JSON.stringify(validState),
      );

      const result = PostSearchState.getSearchState();

      expect(result).toEqual(validState);
    });

    it("should reject objects with wrong types", () => {
      const invalidStates = [
        { searchTerm: 123, activeTag: "tag", viewAll: false },
        { searchTerm: "test", activeTag: null, viewAll: false },
        { searchTerm: "test", activeTag: "tag", viewAll: "false" },
        { searchTerm: "test", activeTag: "tag" }, // missing viewAll
        null,
        "string",
        123,
      ];

      invalidStates.forEach((invalidState) => {
        vi.spyOn(sessionStorage, "getItem").mockReturnValue(
          JSON.stringify(invalidState),
        );

        const result = PostSearchState.getSearchState();

        expect(result).toEqual({
          searchTerm: "",
          activeTag: "",
          viewAll: false,
        });
      });
    });
  });
});
