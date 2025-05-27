import type { CollectionEntry } from "astro:content";

// Define explicit types for collections.
export type PostEntry = CollectionEntry<"posts">;
export type ArchiveEntry = CollectionEntry<"posts">;
export type ProjectEntry = CollectionEntry<"projects">;
export type AffiliationsEntry = CollectionEntry<"affiliations">;

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

// Satisfy eslint type checks for Remark plugins.
export type RemarkPlugin = () => (tree: any, file: any) => void;
