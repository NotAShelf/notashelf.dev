---
title: "Git Commit Fixup"
description: "Auto-squashed commits for a cleaner Git history."
date: 2025-07-01
keywords: ["git", "version-control", "workflow"]
---

One of my gripes with Git, or rather most projects that are version-controlled
with Git, is the lack of clean, parsable histories. A new trick I've learned to
keep my own history clean is to use `git commit --fixup`. You can use
`git commit --fixup <commit-hash>` to create a fixup commit that can be
automatically squashed during an interactive rebase. For example:

```bash
# Make your fix
git add .
git commit --fixup HEAD~2

# Then use autosquash during rebase
git rebase -i --autosquash HEAD~3
```

This automatically moves the fixup commit next to the target commit and marks it
for squashing. Much cleaner than manually editing during interactive rebase!

> [!TIP]
> Set `git config rebase.autosquash true` to enable autosquash by default.
