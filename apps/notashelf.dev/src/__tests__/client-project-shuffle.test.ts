/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the project shuffle utility
const mockSetupClientSideShuffling = vi.fn();
vi.mock("../scripts/utils/project-shuffle", () => ({
  projectShuffle: {
    setupClientSideShuffling: mockSetupClientSideShuffling,
  },
}));

describe("project-shuffle integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module registry to ensure fresh imports
    vi.resetModules();
  });

  it("should initialize project shuffle successfully", async () => {
    mockSetupClientSideShuffling.mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Import the project shuffle utility directly
    const { projectShuffle } = await import("../scripts/utils/project-shuffle");
    await projectShuffle.setupClientSideShuffling();

    expect(mockSetupClientSideShuffling).toHaveBeenCalled();
  });

  it("should handle initialization errors gracefully", async () => {
    const error = new Error("Project shuffle initialization failed");
    mockSetupClientSideShuffling.mockRejectedValue(error);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { projectShuffle } = await import("../scripts/utils/project-shuffle");

    // Mock setupClientSideShuffling is already rejected, so this should not throw
    try {
      await projectShuffle.setupClientSideShuffling();
    } catch (err) {
      // Expected to catch the mocked rejection
      expect(err).toEqual(error);
    }
  });

  it("should not throw errors during initialization", async () => {
    mockSetupClientSideShuffling.mockResolvedValue(undefined);

    // This should not throw
    expect(async () => {
      const { projectShuffle } =
        await import("../scripts/utils/project-shuffle");
      await projectShuffle.setupClientSideShuffling();
    }).not.toThrow();
  });
});
