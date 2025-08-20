import { wasmFeaturedProjects } from "@scripts/wasm";

async function initializeProjectShuffle() {
  console.log("Initializing project shuffle...");
  try {
    await wasmFeaturedProjects.setupClientSideShuffling();
    console.log("Project shuffle initialized successfully");
  } catch (error) {
    console.warn("Failed to initialize project shuffle:", error);
  }
}

initializeProjectShuffle();
