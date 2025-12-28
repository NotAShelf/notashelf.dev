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

/**
 * Determines if a post has a significant update.
 * An update is considered significant if it occurred more than 7 days after publication.
 * @param publishDate The original publication date
 * @param updateDate The update date (optional)
 * @returns true if the update is significant, false otherwise
 */
export function isSignificantUpdate(
  publishDate: Date,
  updateDate?: Date,
): boolean {
  if (!updateDate) return false;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const timeDiff = updateDate.getTime() - publishDate.getTime();

  return timeDiff > SEVEN_DAYS_MS;
}

/**
 * Gets the effective date for a post (used for sorting).
 * Returns the update date if the update is significant (>7 days after publication),
 * otherwise returns the publication date.
 * @param post The post entry
 * @returns The effective date for sorting
 */
export function getEffectiveDate(post: PostEntry): Date {
  const publishDate = new Date(post.data.date);
  const updateDate = post.data.updated
    ? new Date(post.data.updated)
    : undefined;

  if (updateDate && isSignificantUpdate(publishDate, updateDate)) {
    return updateDate;
  }

  return publishDate;
}

/**
 * Sorts posts by their effective date (most recent first).
 * Posts with significant updates will bubble up based on their update date.
 * @param posts Array of post entries to sort
 * @returns Sorted array of posts
 */
export function getSortedPosts(posts: PostEntry[]): PostEntry[] {
  return [...posts].sort((a, b) => {
    const dateA = getEffectiveDate(a);
    const dateB = getEffectiveDate(b);
    return dateB.getTime() - dateA.getTime();
  });
}
