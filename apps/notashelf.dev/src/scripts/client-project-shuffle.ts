// Client-side project shuffling script
import { wasmFeaturedProjects } from "./wasm.ts";

// Initialize and setup client-side shuffling when DOM is ready
async function initializeProjectShuffle() {
  try {
    console.log("Initializing project shuffle...");
    await wasmFeaturedProjects.setupClientSideShuffling();
    console.log("Project shuffle initialized successfully");
  } catch (error) {
    // Fail silently.
    // The page still works without shuffling, but we would like
    // to catch warnings andn try to fix them.
    console.warn("Failed to initialize project shuffle:", error);
  }
}

// Run initialization
initializeProjectShuffle();
