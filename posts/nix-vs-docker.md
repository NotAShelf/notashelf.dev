---
title: "Nix vs Docker: Containers Without the Bloat"
description: "Introduction to the NixOS testing framework with flakes"
date: 2025-04-20
keywords: ["nix", "nixos", "docker"]
---

# Nix vs Docker: Containers Without the Bloat

Docker brought containers into the mainstream by simplifying the idea of
packaging an application and all its dependencies into a single unit. You write
a Dockerfile, build an image, and then you ship it. The abstraction is clean at
first glance, but under the hood, Docker makes some serious compromises. It
depends on mutable state, relies on an imperative build model, and often
produces inconsistent or bloated results.

Nix, by contrast, approaches the same problem from a fundamentally different
angle. It's not a container engine. It doesn't emulate layers. Instead, it
treats builds like pure functions. Given a set of inputs, Nix evaluates a
dependency graph and produces an immutable output. And it does this
reproducibly, deterministically, and without requiring a privileged daemon to
run in the background.

Both tools aim to isolate environments and improve portability, but the
underlying models are so different that it's not a fair one-to-one comparison.
Still, for a growing number of use cases, Nix doesn't just replace Docker. It
does a better job. Nix, after all, is a superset of Docker.

## The Build Model

Dockerfiles are imperative. You declare a sequence of commands: set a base
image, copy some files, install packages, maybe expose a port, and then define
an entry point. These steps are executed one after another, and each one forms a
layer on top of the last. The final image is a snapshot of the resulting
filesystem.

This process is simple but brittle. A change in one line can invalidate the
entire build cache. Even when using pinned base images and lockfiles, there's
always a risk that some transient state---like a registry being temporarily
down, or a package mirror being updated---will corrupt reproducibility.

Nix expressions are declarative. You describe what you want, not how to get
there. Every package build is a function of its inputs: the source code, the
compiler, the dependencies, the environment variables, and the build scripts.
Nothing more. There's no hidden context. No reliance on the global state of your
machine. No network access during builds unless you explicitly allow it.

The difference isn't just philosophical. It has real-world consequences. Docker
requires effort to avoid flakiness; with Nix, reproducibility is the default.

## Filesystem and Image Composition

Docker builds up layers. Each command in the Dockerfile creates a new layer,
stored as a filesystem diff. These layers are stacked, forming the final image.
It's an efficient system for caching, but it introduces complexity. Layers can
contain unnecessary files from intermediate steps. Cleanup has to be done
manually. Even well-maintained images can end up being several hundred megabytes
large, containing outdated binaries or untracked build artifacts.

With Nix, there are no layers. Every build output is stored in a
content-addressed path in the Nix store. The path is derived from a hash of all
the inputs and instructions used to produce it. This guarantees that the same
build will always result in the same output, byte-for-byte. It also allows
deduplication and caching across projects, machines, and users.

In practice, this means that building ten similar applications with Nix doesn't
result in ten different bloated images. Shared dependencies are stored once.
Nothing is duplicated unless it's different. There's no need to worry about
layer ordering or cache busting hacks. You build what you need, and you get
exactly what you asked for.

## Reproducibility

Docker tries to be reproducible, but it isn't by default. You have to go out of
your way to pin image versions, lock dependency managers, and scrub any
filesystem state that could introduce noise. The moment you rely on
`apt-get update` or `npm install` inside the image, your image depends on the
state of the outside world. That state changes. Sometimes subtly. Sometimes
catastrophically.

Nix flips this. It assumes you want reproducibility, and forces you to be
explicit when you don't. If you want to download something during a build, you
must declare it. If your package depends on a specific version of a compiler or
library, it's part of the derivation. Every dependency, direct or transitive, is
captured in the build plan. And because the output path is a hash of all those
inputs, you can verify the build just by checking the hash. No need to diff
images or inspect layers manually.

In multi-stage Docker builds, you sometimes strip down an application to get a
smaller final image. With Nix, there's no need for tricks. You can separate
build and runtime environments cleanly, and export only what you need. And
you'll know it's exactly what you built, because the path hash won't match
otherwise.

## Deployment and Distribution

Docker's deployment model revolves around registries. You build an image, push
it to a registry, then pull it down on the production host. This requires an
always-running Docker daemon, appropriate access credentials, and often,
time-consuming image pulls and extraction.

Nix doesn't need a central registry. You can copy store paths directly between
systems using nix copy or serve them with a binary cache. With tools like
Cachix, you can distribute build artifacts without pushing or pulling massive
tarballs. If the path already exists on the target machine, no data transfer
happens. It's fast, secure, and minimal.

If you really need Docker images---for example, when deploying to
Kubernetes---you can still generate OCI-compatible containers from Nix builds
using tools like `nix2container` or the `dockerTools` module in Nixpkgs. This
means you get the deterministic builds and precise dependency control of Nix,
packaged into a form that the rest of your infrastructure can understand. And
those images are smaller, cleaner, and more predictable.

## Security and Isolation

Docker's model relies on a daemon that often runs as root. Images can come from
untrusted sources, and the build process may include shell scripts that modify
the system in arbitrary ways. Sandboxing is leaky unless you run everything in
production with additional tooling like AppArmor, seccomp, or rootless
containers.

Nix builds run in a sandbox by default. They have no access to the host system,
no write access to the filesystem, and no network access unless explicitly
permitted. The build environment is minimal and predictable. There's no implicit
trust. You can audit exactly what goes into a derivation, and verify it at every
stage.

When you deploy with Nix, you're not just moving bits around. You're verifying a
closed system. You know every file. You know every dependency. You can recreate
it from scratch at any time, with no surprises. This is also what makes NixOS
the true endgame of distro-hopping.

## Closing Thoughts

Docker solved the deployment problem for a world of mutable systems and
inconsistent development environments. But it did so by building on top of an
architecture that makes reproducibility an afterthought. It trades convenience
for long-term reliability. It tries to manage entropy rather than eliminate it.

Nix takes a harder route. It forces you to think about your builds. It doesn't
tolerate shortcuts. But in exchange, you get builds that are correct,
environments that are portable, and artifacts that are trustworthy. It's not
trying to be easy. It's trying to be right.

If you're tired of debugging bloated containers, mysterious build failures, or
inconsistent staging environments, Nix offers a better foundation. Not just an
alternative to Docker, but an upgrade in every meaningful way.
