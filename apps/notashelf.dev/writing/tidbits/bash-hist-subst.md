---
title: "Bash History Substitution Magic"
description: "Quick reference for Bash history substitution commands to modify and reuse previous commands efficiently."
date: 2025-07-01
keywords: ["bash", "cli", "linux"]
---

Beginner or experienced, we all use shells at some point. Some of us want easy,
interactive shells that don't require us to think, but I'm a huge fan of
sticking with my own shell and utilizing its full potential.

A new discovery I've made after years of Linux is that you use `!!:gs/foo/bar/`
to replace all instances of "foo" with "bar" in your last command! This is part
of Bash's history expansion feature and it saves _a lot_ of time I have wasted
editing my previous command in `$EDITOR`.

## Other useful history substitutions

- `!!` - repeat last command
- `!$` - last argument of previous command
- `^old^new` - replace first occurrence of "old" with "new" in last command
- `!!:gs/old/new/` - replace all occurrences of "old" with "new" in last command

Hope this has been helpful to you as much as it has been for me.
