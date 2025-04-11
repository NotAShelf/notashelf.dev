import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const postsCollection = defineCollection({
  type: "content",
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./content/blog/posts",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().optional().default(false),
  }),
});

export const collections = {
  posts: postsCollection,
};
