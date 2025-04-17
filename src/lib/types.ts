import type { CollectionEntry } from "astro:content";

// Define explicit types for collections
export type PostEntry = CollectionEntry<"posts">;
export type ArchiveEntry = CollectionEntry<"posts">;
export type ProjectEntry = CollectionEntry<"projects">;
export type AffiliationsEntry = CollectionEntry<"affiliations">;
