import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().max(99),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.date().optional(),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().optional().default(false),
  }),
});

export const collections = {
  posts: postsCollection,
};
