import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "../../content/posts" }),
  schema: z.object({
    title: z.string().max(99),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string().default("uncategorized"),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().optional().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.toml", base: `./src/data/projects` }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      sourceUrl: z.string(),
      startDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      active: z.boolean().default(true),
      featurable: z.boolean().default(true),
    }),
});

const lists = defineCollection({
  loader: glob({ pattern: "**/[^_]*.toml", base: `./src/data/lists` }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().default(0),
    items: z
      .array(
        z.object({
          title: z.string(),
          subtitle: z.string().optional(),
          url: z.string().optional(),
          note: z.string().optional(),
          year: z.string().optional(),
          rating: z.number().int().min(1).max(5).optional(),
        }),
      )
      .default([]),
  }),
});

const affiliations = defineCollection({
  loader: glob({ pattern: "**/[^_]*.toml", base: "./src/data/affiliations" }),
  schema: z.object({
    logo: z.string().optional(),
    logoIcon: z.string().optional(),
    name: z.string(),
    description: z.string(),
    isIcon: z.boolean(),
  }),
});

export const collections = {
  posts,
  projects,
  lists,
  affiliations,
};
