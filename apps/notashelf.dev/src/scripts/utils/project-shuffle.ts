/**
 * Client-side project shuffling utility for static deployments
 * Handles random project selection and DOM manipulation
 */

interface ShuffleConfig {
  targetCount: number;
  mode: "featured" | "recent";
  root: Element;
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

  private getShuffleConfig(): ShuffleConfig | null {
    const root = document.querySelector<HTMLElement>("[data-shuffle-mode]");
    if (!root) return null;

    const mode = root.dataset.shuffleMode;
    const targetCount = Number(root.dataset.shuffleCount);
    if ((mode !== "featured" && mode !== "recent") || !targetCount) return null;

    return { mode, targetCount, root };
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

    const selectedIndices = this.getRandomIndices(allCards.length, targetCount);

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
  }

  /**
   * Shuffle projects in any layout
   */
  public shuffleProjects(): void {
    const config = this.getShuffleConfig();
    if (!config) {
      return;
    }

    // Handle featured projects (homepage)
    const projectsGrid = config.root.querySelector(".projects-grid");
    if (projectsGrid && config.mode === "featured") {
      this.shuffleFeaturedProjects(projectsGrid, config.targetCount);
      return;
    }

    // Handle recent projects (about page)
    const recentContainer = config.root.querySelector(
      ".recent-projects-container",
    );
    if (recentContainer && config.mode === "recent") {
      this.shuffleRecentProjects(recentContainer, config.targetCount);
      return;
    }
  }

  /**
   * Initialize and perform shuffling
   */
  private initializeShuffle(): void {
    if (this.isInitialized) {
      return;
    }

    this.shuffleProjects();
    this.isInitialized = true;
  }

  /**
   * Setup client-side shuffling with proper timing
   */
  public setupClientSideShuffling(): void {
    const shuffle = () => {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => this.initializeShuffle(), 100);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", shuffle);
    } else {
      shuffle();
    }
  }
}

// Export singleton instance
export const projectShuffle = new ProjectShuffle();

// Export class for testing
export default ProjectShuffle;
