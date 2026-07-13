/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPostSearchState,
  DEFAULT_POST_SEARCH_STATE,
  loadPostSearchState,
  POST_SEARCH_STORAGE_KEY,
  savePostSearchState,
} from "../scripts/utils/post-search";

describe("PostSearch storage", () => {
  beforeEach(() => {
    vi.mocked(sessionStorage.getItem).mockReset();
    vi.mocked(sessionStorage.setItem).mockReset();
    vi.mocked(sessionStorage.removeItem).mockReset();
    vi.mocked(sessionStorage.clear).mockReset();
    vi.mocked(sessionStorage.getItem).mockReturnValue(null);
  });

  it("loads the default state when storage is empty", () => {
    expect(loadPostSearchState()).toEqual(DEFAULT_POST_SEARCH_STATE);
  });

  it("saves and loads the Svelte search state shape", () => {
    const state = {
      searchTerm: "nix",
      activeTag: "nixos",
      viewAll: true,
      recentlyUpdated: true,
    };

    savePostSearchState(state);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      POST_SEARCH_STORAGE_KEY,
      JSON.stringify(state),
    );
    vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(state));
    expect(loadPostSearchState()).toEqual(state);
  });

  it("ignores stale storage entries with the old shape", () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue(
      JSON.stringify({ searchTerm: "nix", activeTag: "nixos", viewAll: true }),
    );

    expect(loadPostSearchState()).toEqual(DEFAULT_POST_SEARCH_STATE);
  });

  it("clears stored search state", () => {
    savePostSearchState({
      searchTerm: "astro",
      activeTag: "svelte",
      viewAll: true,
      recentlyUpdated: false,
    });

    clearPostSearchState();

    expect(sessionStorage.removeItem).toHaveBeenCalledWith(
      POST_SEARCH_STORAGE_KEY,
    );
  });

  it("falls back to defaults on invalid JSON", () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue("not json");

    expect(loadPostSearchState()).toEqual(DEFAULT_POST_SEARCH_STATE);
  });
});
