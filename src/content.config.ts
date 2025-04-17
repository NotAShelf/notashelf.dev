import { defineCollection, z, reference } from "astro:content";
import { file, glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./posts" }),
  schema: z.object({
    title: z.string().max(99),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().optional().default(false),
  }),
});

const tags = defineCollection({
  loader: file(`./src/data/tags.json`),
  schema: z.object({
    id: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.json", base: `./src/data/projects` }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      sourceUrl: z.string(),
      startDate: z.coerce.date().optional(),
      tags: z.array(reference("tags")).default([]),
      active: z.boolean().default(true),
      featurable: z.boolean().default(true),
    }),
});

export const collections = {
  posts,
  tags,
  projects,
};
