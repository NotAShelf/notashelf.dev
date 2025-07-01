import { getCollection } from "astro:content";
import type { TidbitEntry } from "./types";

export async function getTidbitStaticPaths() {
  const tidbitEntries = (await getCollection("tidbits")) as TidbitEntry[];
  return tidbitEntries.map((entry: TidbitEntry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

// Tidbit data with dates
export interface TidbitData {
  title: string;
  description?: string;
  date: Date;
  keywords?: string[];
  draft?: boolean;
  [key: string]: unknown;
}

/**
 * Converts tidbit dates to ISO strings
 * @param data Tidbit data containing date objects
 * @param options Configuration options
 * @returns Tidbit data with ISO string dates or null if validation fails and throwOnError is false
 * @throws Error if validation fails and throwOnError is true
 */
export function convertTidbitDates(
  data: TidbitData,
  options: { throwOnError?: boolean } = { throwOnError: true },
) {
  try {
    // Validate date is a valid Date object
    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      throw new Error("Invalid date object in tidbit data");
    }

    return {
      ...data,
      date: data.date.toISOString(),
    };
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }

    // Log error but return null to handle gracefully
    console.error("Error converting tidbit dates:", error);
    return null;
  }
}
