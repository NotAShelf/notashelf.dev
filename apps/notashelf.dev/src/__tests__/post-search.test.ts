/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import {
  clearPostSearchState,
  DEFAULT_POST_SEARCH_STATE,
  loadPostSearchState,
  POST_SEARCH_STORAGE_KEY,
  savePostSearchState,
} from "../scripts/utils/post-search";

describe("PostSearch storage", () => {
  it("persists the active search filters and clears them", () => {
    const state = {
      searchTerm: "nix",
      activeTag: "nixos",
      viewAll: true,
      recentlyUpdated: true,
    };

    savePostSearchState(state);
    expect(loadPostSearchState()).toEqual(state);
    clearPostSearchState();
    expect(loadPostSearchState()).toEqual(DEFAULT_POST_SEARCH_STATE);
  });

  it.each([
    ["stale state", '{"searchTerm":"nix","activeTag":"nixos","viewAll":true}'],
    [
      "invalid field type",
      '{"searchTerm":"nix","activeTag":"nixos","viewAll":true,"recentlyUpdated":"yes"}',
    ],
    ["invalid JSON", "not json"],
  ])("ignores %s in session storage", (_reason, raw) => {
    sessionStorage.setItem(POST_SEARCH_STORAGE_KEY, raw);
    expect(loadPostSearchState()).toEqual(DEFAULT_POST_SEARCH_STATE);
  });
});
