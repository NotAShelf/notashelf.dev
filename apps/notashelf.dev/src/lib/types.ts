import type { CollectionEntry } from "astro:content";

// Allowed keywords for posts and tidbits (shared between schema and runtime)
export const allowedKeywords = [
  "thoughts",
  "programming",
  "software",
  "tutorial",
  "nix",
  "federation",
  "nixos",
  "linux",
  "security",
  "flakes",
  "rant",
  "web",
  "news",
  "neovim",
  "git",
  "cli",
  "bash",
  "productivity",
  "version-control",
  "workflow",
  "development",
  "packaging",
] as const;

export type AllowedKeyword = (typeof allowedKeywords)[number];

// Define explicit types for collections.
export type PostEntry = CollectionEntry<"posts">;
export type TidbitEntry = CollectionEntry<"tidbits">;
export type ProjectEntry = CollectionEntry<"projects">;
export type AffiliationsEntry = CollectionEntry<"affiliations">;

// Archive entries are just posts
export type ArchiveEntry = CollectionEntry<"posts">;

// Post with reading time information
export interface PostWithReadingTime {
  id: string;
  data: {
    title: string;
    date: Date;
    description?: string;
    draft?: boolean;
  };
  readingTime: number;
}

// Combined content entry type for posts and tidbits
export type ContentEntry = PostEntry | TidbitEntry;

// Type guard functions
export function isPostEntry(entry: ContentEntry): entry is PostEntry {
  return entry.collection === "posts";
}

export function isTidbitEntry(entry: ContentEntry): entry is TidbitEntry {
  return entry.collection === "tidbits";
}
