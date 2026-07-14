/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectShuffle from "../scripts/utils/project-shuffle";

function addCards(container: Element, count: number) {
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "project-card pre-shuffle-hide";
    card.dataset.index = String(i);
    container.appendChild(card);
  }
}

describe("ProjectShuffle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("shows three shuffled cards on the homepage featured grid", () => {
    const section = document.createElement("section");
    section.dataset.shuffleMode = "featured";
    section.dataset.shuffleCount = "3";

    const grid = document.createElement("div");
    grid.className = "projects-grid pre-shuffle-hide-grid";
    addCards(grid, 8);
    section.appendChild(grid);
    document.body.appendChild(section);

    new ProjectShuffle().setupClientSideShuffling();
    vi.runAllTimers();

    expect(grid.children).toHaveLength(3);
    expect(grid.classList.contains("pre-shuffle-hide-grid")).toBe(false);
    expect(
      Array.from(grid.children).every(
        (child) => !child.classList.contains("pre-shuffle-hide"),
      ),
    ).toBe(true);
  });

  it("shows five shuffled cards on the about page recent layout", () => {
    window.history.replaceState({}, "", "/about");

    const section = document.createElement("section");
    section.id = "projects-display";
    section.dataset.shuffleMode = "recent";
    section.dataset.shuffleCount = "5";
    const container = document.createElement("div");
    container.className = "recent-projects-container pre-shuffle-hide-grid";
    const top = document.createElement("div");
    top.className = "top-row";
    const bottom = document.createElement("div");
    bottom.className = "bottom-row";
    addCards(top, 4);
    addCards(bottom, 4);
    container.append(top, bottom);
    section.appendChild(container);
    document.body.appendChild(section);

    new ProjectShuffle().setupClientSideShuffling();
    vi.runAllTimers();

    expect(top.children).toHaveLength(3);
    expect(bottom.children).toHaveLength(2);
    expect(container.classList.contains("pre-shuffle-hide-grid")).toBe(false);
  });
});
