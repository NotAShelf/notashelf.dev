---
title: "Please Just Stop!"
description: "Picking the right tool for the job, Nix"
date: 2024-06-02
archived: true
---

[Just](https://github.com/casey/just) is a fast and powerful command runner,
built with Rust. It is fast, simple and available
[almost everywhere](https://github.com/casey/just?tab=readme-ov-file#packages)
with top-notch editor and CI integration.

So why do I have beef with Just?

## Please, just stop

I actually have no beef with Just, I have briefly read the project page and
tested it somewhat extensively on my own machine. The tool itself is impressive,
however, it is also redundant when tools like Nix exist!

### Just do better!

If you have previously read my blog, you probably know that I use the
[Nix package manager](https://nixos.org/explore/)[^1] on a daily basis, and
NixOS as my primary system.

> For those who have no idea what Nix is, it's a package manager and a build
> tool that supports declarative, reproducible and reliable builds & deployments
> anywhere. I invite you to read more about it
> [here](https://nix.dev/#what-can-you-do-with-nix)

Nix does not exactly compare with Just, as Just is a command runner but it
provides its full functionality in Nix devShells. You can use devShells not only
to declaratively install your development packages inside specific project
directories (which is built upon further by projects like
[direnv](https://direnv.net/)) but also write fully fledged scripts and helpers
in Bash, Python, Ruby or whatever interpreted or compiled language you want to
make them available in your projects.

A common counter-argument to this is that they don't want to force people to
install yet another tool, however, Just _is_ that "yet another tool" you said
you don't want people to install. If I am installing something, I _might as well
opt in for the extensible one_.

### In the wild

My intention is neither to gatekeep Just, nor to advertise Nix for new people.
What I want to get at is that if you have Nix installed, you **do not need
Just**. Simple as that.

While browsing GitHub, I have seen _countless_ Nix projects that recommend using
Just to run some simple commands (such as `nix build` in large projects, or
`nixos-rebuild` in system configurations). Please just stop.

When given a powerful tool (which _is_ installed on your system) you should be
utilizing that tool to its fullest extent, _not_ introduce a completely
irrelevant tool that is inferior to what you have in every way.

If you are using NixOS and want to provide bootstrapping commands to rebuild
your system, **use devShells**.

## Conclusion

And this has been my rant. Please understand that my aim is not to discourage
you from using Just, but to encourage you to use the correct tool on your belt.

If you use NixOS but have zero clue how to use devShells, then I implore you to
reconsider your choice of distro. NixOS is a powerful tool that needs, nay,
_demands_ your attention and understanding.

If you do not intend to use the blessings provided by Nix to you, then you
probably do not need to suffer the many side effects of Nix (such as but not
limited to [severe hairloss](https://github.com/gerg-l)).

### What to do instead?

For my curious but equally lazy readers, here is how you may use a devShell.

Start by creating a `shell.nix` that contains your shell environment.

```nix
{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    # nativeBuildInputs is usually what you want -- tools you need to run
    nativeBuildInputs = with pkgs.buildPackages; [ ];
}
```

This setup implies you are using channels, but similar instructions will apply
on flakes. Regardless, acquire your development packages from nixpkgs and put
them in your shell's `nativeBuildInputs`. If you are trying to put, e.g., a
Python script available in [nixpkgs](https://github.com/NixOS/nixpkgs), simply
place it in `nativeBuildInputs`. shell, then you can write your script as
follows:

```nix
{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
      (pkgs.writeShellScriptBin "my-builder-script" ''
        echo "hello world"
      '')
    ];
}
```

This will place `my-builder-script` in your `PATH` after you enter the shell
with e.g. `nix develop` or automagically if you use something like direnv.
Obviously the contents can be whatever you want, and you can write a script as
complex as you need. Aside from being a simple runner that did what Just does,
you will also have a fully reproducible script that fulfils your needs without
installing an additional tool thats sole purpose is to run commands.

If you use Just to run your rebuild scripts, you can easily package your rebuild
scripts with Nix using `writeShellScript*` from trivial builders collection and
completely ditch Just. Remember that someone observing your NixOS configuration
is less likely to use Just, and more likely to use Nix. Choose the appropriate
tool for the job, lest you over or underprepare.

[^1]: Nix is actually not a package manager. It has been called that was to make
    it more approachable for the casual users, but it is actually a build tool.
    Or better yet, it is **lambda calculus on files**. I feel the need to
    clarify, because package management is _only one_ of Nix's features. Whereas
    running commands is Just's only function.
