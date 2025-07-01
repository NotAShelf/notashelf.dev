---
title: "Nix Shell with Specific Package Versions"
description: "How to use nix-shell with specific package versions using commits or flakes for reproducible development environments."
date: 2024-01-10
keywords: ["nix", "nixos", "development", "packaging"]
---

Truth be told, I am a little upset at the fact that Nixpkgs (not Nix) doesn't
make it very easy to pin specific versions of _packages_ for your development
workflow. When a version you need is upgraded in Nixpkgs, it is no longer
available to you and your best bet becomes to override the derivation with your
own version parameters, or to write your own derivation.

Recently I've had a similar problem in my development _shells_ where a new
package version completely broke my workflow, but it was not feasible yet to
upgrade the environment in its entirety. Instead, I've decided to pin Nixpkgs
but one problem: I don't _actually_ use a `shell.nix` for the project!

My "solution" [^1] to this problem was to change the `nix-shell` command I've
used to enter my shell

[^1]: Hack, I mean hack.

```bash
nix-shell -p nodejs \
  --arg pkgs 'import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/COMMIT_HASH.tar.gz") {}'
```

To be honest this would be more easily solved by simply creating a `shell.nix`
that declares my setup, but I'm stubborn and that is the less fun option.
Besides, this post wouldn't exist if I picked the easy way so thank you past me!

Also, I've decided that I'll be using the stable channel for my shell, so
mission accomplished... sorta. Here's how it's done with the flakes-enabled Nix3
CLI:

```bash
nix shell github:NixOS/nixpkgs?ref=<COMMIT_HASH_OR_TAG>#nodejs
```

This lets you test against different package versions without polluting your
system! Though, you should probably just set up a flake or a `shell.nix`...
