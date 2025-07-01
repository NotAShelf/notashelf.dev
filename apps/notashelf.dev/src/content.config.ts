import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Allowed keywords for posts and tidbits.
const allowedKeywords = [
  "thoughts",
  "programming",
  "software",
  "tutorial",
  "nix",
  "federation",
  "nixos",
  "linux",
  "security",
  "flakes",
  "rant",
  "web",
  "news",
  "neovim",
  "git",
  "cli",
  "bash",
  "productivity",
  "version-control",
  "workflow",
  "development",
  "packaging",
] as const;

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./writing/posts" }),
  schema: z.object({
    title: z.string().max(99),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    keywords: z.array(z.enum(allowedKeywords)).default([]),
    draft: z.boolean().default(false),
    archived: z.boolean().optional().default(false),
  }),
});

const tidbits = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./writing/tidbits" }),
  schema: z.object({
    title: z.string().max(80),
    description: z.string().optional(),
    date: z.coerce.date(),
    keywords: z.array(z.enum(allowedKeywords)).default([]),
    draft: z.boolean().default(false),
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
      tags: z.array(z.string()).default([]),
      active: z.boolean().default(true),
      featurable: z.boolean().default(true),
    }),
});

const affiliations = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/data/affiliations" }),
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
  tidbits,
  projects,
  affiliations,
};
