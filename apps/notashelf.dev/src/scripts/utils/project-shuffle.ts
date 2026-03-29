/**
 * Client-side project shuffling utility for static deployments
 * Handles random project selection and DOM manipulation
 */

interface ShuffleConfig {
  targetCount: number;
  mode: "featured" | "recent" | "projects";
}

export class ProjectShuffle {
  private isInitialized = false;

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random sample from array without replacement
   */
  private randomSample<T>(array: T[], count: number): T[] {
    if (array.length <= count) return array;
    const shuffled = this.shuffleArray(array);
    return shuffled.slice(0, count);
  }

  /**
   * Get random indices for a given total and sample count
   */
  private getRandomIndices(totalCount: number, sampleCount: number): number[] {
    const indices = Array.from({ length: totalCount }, (_, i) => i);
    return this.randomSample(indices, sampleCount);
  }

  /**
   * Determine shuffle configuration based on context
   */
  private getShuffleConfig(): ShuffleConfig | null {
    const pathname = window.location.pathname;
    const isFeaturedSection =
      document.querySelector("#projects-display") !== null;
    const isProjectsPage = pathname.includes("/projects");

    console.log("Shuffle context:", {
      pathname,
      isFeaturedSection,
      isProjectsPage,
    });

    if (isFeaturedSection && pathname === "/") {
      return { targetCount: 3, mode: "featured" };
    } else if (isProjectsPage) {
      return { targetCount: 6, mode: "projects" };
    } else if (pathname === "/about") {
      return { targetCount: 5, mode: "recent" };
    }

    return null;
  }

  /**
   * Shuffle projects in featured layout (.projects-grid)
   */
  private shuffleFeaturedProjects(
    projectsGrid: Element,
    targetCount: number,
  ): void {
    const projectCards = Array.from(projectsGrid.children);
    if (projectCards.length <= targetCount) return;

    console.log(
      `Shuffling featured projects: ${projectCards.length} -> ${targetCount}`,
    );

    const selectedIndices = this.getRandomIndices(
      projectCards.length,
      targetCount,
    );

    const selectedCards = selectedIndices
      .map((index) => projectCards[index])
      .filter(Boolean) as Element[];

    // Clear the grid
    while (projectsGrid.firstChild) {
      projectsGrid.removeChild(projectsGrid.firstChild);
    }

    // Add selected cards back and remove .pre-shuffle-hide
    selectedCards.forEach((card) => {
      card.classList.remove("pre-shuffle-hide");
      projectsGrid.appendChild(card);
    });

    // Remove grid hide class after shuffle is complete
    (projectsGrid as HTMLElement).classList.remove("pre-shuffle-hide-grid");

    console.log(
      `Featured shuffle complete: showing ${selectedCards.length} projects`,
    );
  }

  /**
   * Shuffle projects in recent layout (.recent-projects-container)
   */
  private shuffleRecentProjects(
    recentContainer: Element,
    targetCount: number,
  ): void {
    const topRow = recentContainer.querySelector(".top-row");
    const bottomRow = recentContainer.querySelector(".bottom-row");

    if (!topRow || !bottomRow) return;

    // Collect all project cards from both rows
    const allCards = [
      ...Array.from(topRow.children),
      ...Array.from(bottomRow.children),
    ];

    if (allCards.length <= targetCount) return;

    console.log(
      `Shuffling recent projects: ${allCards.length} -> ${targetCount}`,
    );

    const selectedIndices = this.getRandomIndices(
      allCards.length,
      targetCount,
    );

    const selectedCards = selectedIndices
      .map((index) => allCards[index])
      .filter(Boolean) as Element[];

    // Clear both rows
    while (topRow.firstChild) {
      topRow.removeChild(topRow.firstChild);
    }
    while (bottomRow.firstChild) {
      bottomRow.removeChild(bottomRow.firstChild);
    }

    // Redistribute: first 3 cards to top row, remaining to bottom row
    selectedCards.slice(0, 3).forEach((card) => {
      card.classList.remove("pre-shuffle-hide");
      topRow.appendChild(card);
    });
    selectedCards.slice(3).forEach((card) => {
      card.classList.remove("pre-shuffle-hide");
      bottomRow.appendChild(card);
    });

    // Remove grid hide class after shuffle is complete
    (recentContainer as HTMLElement).classList.remove("pre-shuffle-hide-grid");

    console.log(
      `Recent shuffle complete: showing ${selectedCards.length} projects`,
    );
  }

  /**
   * Shuffle projects in any layout
   */
  public shuffleProjects(): void {
    const config = this.getShuffleConfig();
    if (!config) {
      console.log("No valid shuffle context found, skipping");
      return;
    }

    // Handle featured projects (homepage)
    const projectsGrid = document.querySelector(".projects-grid");
    if (projectsGrid && config.mode === "featured") {
      this.shuffleFeaturedProjects(projectsGrid, config.targetCount);
      return;
    }

    // Handle recent projects (about page)
    const recentContainer = document.querySelector(
      ".recent-projects-container",
    );
    if (recentContainer && config.mode === "recent") {
      this.shuffleRecentProjects(recentContainer, config.targetCount);
      return;
    }

    // Handle projects page (hide/show pattern)
    if (projectsGrid && config.mode === "projects") {
      const projectCards = Array.from(projectsGrid.children) as HTMLElement[];
      if (projectCards.length <= config.targetCount) return;

      const selectedIndices = this.getRandomIndices(
        projectCards.length,
        config.targetCount,
      );

      projectCards.forEach((card, index) => {
        if (selectedIndices.includes(index)) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });

      console.log(
        `Projects page shuffle complete: showing ${config.targetCount} out of ${projectCards.length} projects`,
      );
    }
  }

  /**
   * Initialize and perform shuffling
   */
  private initializeShuffle(): void {
    if (this.isInitialized) {
      console.log("Shuffle already initialized, skipping");
      return;
    }

    console.log("Initializing project shuffle...");

    this.shuffleProjects();
    this.isInitialized = true;
    console.log("Project shuffle initialization complete");
  }

  /**
   * Setup client-side shuffling with proper timing
   */
  public setupClientSideShuffling(): void {
    console.log("Setting up client-side project shuffling");
    console.log("Document ready state:", document.readyState);

    const shuffle = () => {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => this.initializeShuffle(), 100);
    };

    if (document.readyState === "loading") {
      console.log("Waiting for DOM to load");
      document.addEventListener("DOMContentLoaded", shuffle);
    } else {
      console.log("DOM already loaded, shuffling immediately");
      shuffle();
    }
  }
}

// Export singleton instance
export const projectShuffle = new ProjectShuffle();

// Export class for testing
export default ProjectShuffle;
