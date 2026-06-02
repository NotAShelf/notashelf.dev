# @notashelf/content

Canonical source and workspace package for content available on
<https://notashelf.dev>. Blog posts live in `posts/` and are loaded by
`apps/notashelf.dev` through Astro content collections. Add a `category`
frontmatter field to categorize a post:

```yaml
---
title: Example Post
date: 2026-01-01
category: nix
keywords: ["nix", "tutorial"]
---
```

Posts without `category` default to `uncategorized`. The category system has
implications I'm yet to engage with but it's an "improvement" over my previous
design, which I hated since day one.
