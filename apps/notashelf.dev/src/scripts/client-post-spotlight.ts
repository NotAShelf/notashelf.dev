// Client-side post spotlight randomization script
import { wasmFeaturedProjects } from "./wasm.ts";

// Initialize and setup client-side post spotlight randomization when DOM is ready
async function initializePostSpotlightShuffle() {
  try {
    console.log("Initializing post spotlight shuffle...");

    // Ensure WASM is initialized
    await wasmFeaturedProjects.init();

    // Find the featured content container
    const featuredContent = document.querySelector(".featured-content");
    if (!featuredContent) {
      console.warn("Featured content container not found");
      return;
    }

    // Get all posts (spotlight + side posts)
    const spotlightPost = featuredContent.querySelector(".spotlight-post");
    const postsContainer = featuredContent.querySelector(".posts-side");
    const sidePosts = postsContainer
      ? Array.from(postsContainer.querySelectorAll(".side-post"))
      : [];

    if (!spotlightPost || sidePosts.length === 0) {
      console.log(
        "Not enough posts to shuffle in spotlight (spotlight:",
        !!spotlightPost,
        "side posts:",
        sidePosts.length,
        ")",
      );
      return;
    }

    const allPostElements = [spotlightPost, ...sidePosts];

    if (allPostElements.length < 2) {
      console.log(
        "Not enough posts to shuffle (count:",
        allPostElements.length,
        ")",
      );
      return;
    }

    console.log("Shuffling", allPostElements.length, "posts in spotlight");

    // Get shuffled indices from WASM
    const indices = Array.from(Array(allPostElements.length).keys());
    const shuffledIndicesJson = await wasmFeaturedProjects.shuffleJsonArray(
      JSON.stringify(indices),
    );
    const shuffledIndices = JSON.parse(shuffledIndicesJson);

    // Store original titles for debugging
    const originalTitles = allPostElements.map((post) => {
      const titleElement = post.querySelector("h2 a, h3 a, .post-title a, a");
      return titleElement ? titleElement.textContent?.trim() : "Unknown";
    });

    // Clone original posts to preserve them
    const originalPosts = allPostElements.map(
      (post) => post.cloneNode(true) as Element,
    );

    // Get new assignments
    const newSpotlightIndex = shuffledIndices[0];
    const newSideIndices = shuffledIndices.slice(1);

    // Replace spotlight post with animation-friendly approach
    const newSpotlightPost = originalPosts[newSpotlightIndex];
    newSpotlightPost.className = "spotlight-post";

    // Use replaceWith for better DOM handling
    spotlightPost.replaceWith(newSpotlightPost);

    // Replace side posts
    if (postsContainer) {
      // Clear existing side posts
      postsContainer.innerHTML = "";

      // Add new side posts
      newSideIndices.forEach((index: number, sideIndex: number) => {
        const newSidePost = originalPosts[index];
        // Preserve the first/second class for styling
        newSidePost.className = `side-post ${sideIndex === 0 ? "first" : "second"}`;
        postsContainer.appendChild(newSidePost);
      });

      // Force reflow
      void (postsContainer as HTMLElement).offsetHeight;
    }

    // Debug: show the new order
    const newTitles = [
      newSpotlightPost
        .querySelector("h2 a, h3 a, .post-title a, a")
        ?.textContent?.trim() || "Unknown",
      ...newSideIndices.map((index: number) => {
        const titleElement = originalPosts[index].querySelector(
          "h2 a, h3 a, .post-title a, a",
        );
        return titleElement ? titleElement.textContent?.trim() : "Unknown";
      }),
    ];

    console.log(
      "Post spotlight shuffled successfully:",
      "\nOriginal order:",
      originalTitles,
      "\nNew order:",
      newTitles,
      "\nUsing indices:",
      shuffledIndices,
    );
  } catch (error) {
    // Fail silently
    // The page still works with original order
    console.warn("Failed to shuffle post spotlight:", error);
  }
}

// Run initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePostSpotlightShuffle);
} else {
  initializePostSpotlightShuffle();
}
