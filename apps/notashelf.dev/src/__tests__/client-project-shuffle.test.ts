/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the entire wasm module
const mockSetupClientSideShuffling = vi.fn();
vi.mock("../scripts/wasm.ts", () => ({
  wasmFeaturedProjects: {
    setupClientSideShuffling: mockSetupClientSideShuffling,
  },
}));

describe("client-project-shuffle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module registry to ensure fresh imports
    vi.resetModules();
  });

  it("should initialize project shuffle successfully", async () => {
    mockSetupClientSideShuffling.mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Import the module which will execute the initialization immediately
    await import("../scripts/client-project-shuffle.ts");

    // Wait for the Promise to resolve
    await new Promise(process.nextTick);

    expect(mockSetupClientSideShuffling).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Initializing project shuffle...");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Project shuffle initialized successfully",
    );
  });

  it("should handle initialization errors gracefully", async () => {
    const error = new Error("WASM initialization failed");
    mockSetupClientSideShuffling.mockRejectedValue(error);

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    // Import the module which will execute the initialization immediately
    await import("../scripts/client-project-shuffle.ts");

    // Wait for the Promise to resolve
    await new Promise(process.nextTick);

    expect(mockSetupClientSideShuffling).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Initializing project shuffle...",
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to initialize project shuffle:",
      error,
    );
  });

  it("should not throw errors during initialization", async () => {
    mockSetupClientSideShuffling.mockResolvedValue(undefined);

    // This should not throw
    expect(() => import("../scripts/client-project-shuffle.ts")).not.toThrow();
  });
});
