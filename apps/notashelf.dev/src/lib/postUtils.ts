import { getCollection } from "astro:content";
import type { PostEntry } from "./types";

export async function getPostStaticPaths() {
  const postEntries = await getCollection("posts");
  return postEntries.map((entry: PostEntry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

// Define interface for post data with dates
export interface PostData {
  title: string;
  description?: string;
  date: Date;
  updated?: Date;
  keywords?: string[];
  [key: string]: unknown;
}

/**
 * Converts post dates to ISO strings
 * @param data Post data containing date objects
 * @param options Configuration options
 * @returns Post data with ISO string dates or null if validation fails and throwOnError is false
 * @throws Error if validation fails and throwOnError is true
 */
export function convertPostDates(
  data: PostData,
  options: { throwOnError?: boolean } = { throwOnError: true },
) {
  try {
    // Validate date is a valid Date object
    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      throw new Error("Invalid date object in post data");
    }

    // Validate updated date if present
    if (
      data.updated !== undefined &&
      (!(data.updated instanceof Date) || isNaN(data.updated.getTime()))
    ) {
      throw new Error("Invalid updated date object in post data");
    }

    return {
      ...data,
      date: data.date.toISOString(),
      updated: data.updated ? data.updated.toISOString() : undefined,
    };
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }

    // Log error but return null to handle gracefully
    console.error("Error converting post dates:", error);
    return null;
  }
}
