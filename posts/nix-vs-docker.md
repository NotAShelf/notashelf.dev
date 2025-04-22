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

Take this example:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

If `npm install` happens at build time, the image depends on the current state
of the npm registry. A patch update upstream can change your build without
notice. It's not deterministic, and it's not safe.

Here's how the same thing works in Nix:

```nix
pkgs.mkShell {
  buildInputs = [ pkgs.nodejs ];
  shellHook = ''
    export NODE_PATH=$(npm config get prefix)/lib/node_modules
  '';
}
```

In a real build derivation, you'd pin the exact Node version and even vendor
`node_modules` to guarantee purity. That's not just possible---it's the default
behavior. The build is a pure function. Run it anywhere with the same inputs,
get the same output.

Nix expressions, on another hand, are declarative. You describe what you want,
not how to get there. Every package build is a function of its inputs: the
source code, the compiler, the dependencies, the environment variables, and the
build scripts. Nothing more. There's no hidden context. No reliance on the
global state of your machine. No network access during builds unless you
explicitly allow it, e.g., with `--no-sandbox`.

## Filesystem and Image Composition

Docker builds up layers. Each command creates a filesystem diff. These are
cached and stacked. But unless you're extremely careful, you accumulate garbage.

Consider a typical pattern:

```dockerfile
RUN apt-get update && apt-get install -y build-essential python3 \
    && rm -rf /var/lib/apt/lists/*
```

This trick is needed to keep images small. If you forget to clean up, that layer
includes every downloaded `.deb` file and package index.

With Nix, you never need these hacks. The build output contains only what was
declared. Here's a `default.nix` to build a Python app:

```nix
{ pkgs ? import <nixpkgs> {} }:

pkgs.buildPythonPackage {
  pname = "myapp";
  version = "0.1.0";
  src = ./.;
  propagatedBuildInputs = [ pkgs.python3.pkgs.requests ];
}
```

No accidental state. No garbage left in `/var`. And no need to manually squash
layers. You get a single, deduplicated output path like:

```sh
/nix/store/some-hash-myapp-0.1.0/
```

That path is content-addressed. You can copy it, cache it, or reproduce it
anywhere.

## Reproducibility

Docker can be made reproducible if you treat it like a hostile system and strip
away everything nondeterministic. This _is_ possible, but you'll notice very
quickly that the defaults work against you. Correctness is possible, but it is
pushed back in the name of 'convenience' for mediocre solutions to difficult
problems.

You can, for example, pin your base image. Vendor your dependencies. Disable all
dynamic package resolution. Even then, something can, and most likely will,
still slip through.

In Nix, however, reproducibility is not an extra step. It is part of the system
design. If your build depends on `openssl`, and the OpenSSL derivation changes,
the hash of your app changes. If nothing changes, the hash remains the same.

Want to verify the reproducibility of your derivation? Diff it.

```sh
nix build .#myapp
nix build .#myapp --rebuild
diff -r result/ result-2/
```

Or use diffoscope. Regardless, the outputs will be byte-for-byte identical.
Docker can't promise that unless you freeze the entire universe.

## Deployment and Distribution

Docker deployments depend on registries. Push your image to Docker Hub, Amazon
ECR, or GitHub Container Registry. Then pull it down somewhere else. This step
adds overhead. You're moving entire layered tarballs across the network.

And of course, if you use private registries, you're stuck managing credentials
and dealing with rate limits or token expiry.

With Nix, you have direct control. You can copy artifacts from one machine to
another with:

```sh
nix copy --to ssh://prod-server ./result
```

Or even to an S3-compatible storage system:

```sh
nix copy --to s3://my-bucket?region=eu-west-1&endpoint=example.com nixpkgs#hello
```

No registry required. No daemon involved. And thanks to the content hash,
nothing is copied if the store path already exists.

If you are working with a public project, using a binary cache like Cachix is
even simpler. You can build things inside Github workflows, upload once, and
reuse everywhere.

And if you really need Docker compatibility?

```nix
dockerTools.buildImage {
  name = "myapp";
  config = {
    Cmd = [ "node" "index.js" ];
  };
  contents = [ myApp ];
}
```

This gives you a reproducible Docker image—without relying on a Dockerfile or
layers at all.

## Security and Isolation

Docker builds often run with elevated privileges. The Docker daemon runs as
root, and most images execute shell commands during build. Unless you harden
every stage, you're at risk. Sandboxing is optional. Escape vectors are known.

Nix doesn't run a daemon. It doesn't need root. And by default, it builds in a
sandbox with no network, no writable files, and no access to your home
directory.

Here's an example failure you'd get if you try to break the sandbox:

```sh
cp ~/.ssh/id_rsa .
```

If you're building with `--option sandbox true`, this fails. The sandbox
prevents access outside declared paths.

This model isn't just more secure. It's verifiable. You can trace the entire
dependency graph and inspect every file that went into the build. That's the
foundation NixOS builds on---where your entire OS, including the kernel, is just
another derivation.

## Tooling and Ecosystem

Docker is supported by a wide array of third-party tools. Compose, BuildKit,
Docker Hub, Portainer, etc. Each one of those tools are trying to solve a piece
of the container puzzle, but these tools are fragmented and often orthogonal.
Compose files don't integrate cleanly with Dockerfiles. Secrets management is
bolted on. Native caching and layering are leaky abstractions at bes

The Nix ecosystem, in contrast, is more unified. Flakes, [^1] despite their
current state and perception by the community, give you a single entry point for
dependency specification, building, testing, and deployment. You define inputs,
outputs, and devShells in one file, and they work across all tools that support
the flake interface.

[^1]: I know, I know. There is a lot of outrage around flakes. But consider
    this: every

Need to test a system configuration? Use `nixos-rebuild test` with a flake. Need
a temporary environment for hacking? `nix develop`. Want to run integration
tests? Use `nixos-test`. Tools like `lorri`, `direnv`, and `nixd` enhance
developer ergonomics with automatic environment loading and IDE integration.

Instead of chaining loosely-coupled CLIs and YAML fragments, Nix encourages
composition. Everything is just a function, and everything is declarative. This
reduces surface area and makes behavior more predictable.

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
