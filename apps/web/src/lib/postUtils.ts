import { getCollection } from "astro:content";
import type { PostEntry } from "./types";

export async function getPostStaticPaths() {
  const postEntries = await getCollection("posts");
  return postEntries.map((entry: PostEntry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

export function convertPostDates(data: any) {
  return {
    ...data,
    date: data.date.toISOString(),
    updated: data.updated ? data.updated.toISOString() : undefined,
  };
}
