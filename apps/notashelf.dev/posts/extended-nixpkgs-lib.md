---
title: "When, Why and How to Extend Nixpkgs' Standard Library"
description: "Reasons why and how you might create your own extended library"
date: 2025-02-01
keywords: ["nix", "tutorial"]
---

# When, Why and How to Extend Nixpkgs Standard Library

In plenty of cases, you might need to write your own custom functions and store
them somewhere. While it is conceptually possible and easy to define them inside
an argument you might want to stick in for example `specialArgs` in the context
of a NixOS configuration, there are easier and more ergonomic ways of doing so.

## What is `nixpkgs.lib`

In the context of Nix/OS, `nixpkgs.lib` refers to a module within the Nixpkgs
repository that acts as a collection of helpful functions and other utilities
designed around usage in Nixpkgs and by extension NixOS configurations. We often
use those functions to simplify our configurations and the Nix package build
processes. It is available as a top-level attribute as `nixpkgs.lib`, but also
inside `pkgs` as `pkgs.lib`. While using `lib.nixosSystem`, it is also added to
your system's `specialArgs`[^1] so that you can add it to the argument set (i.e.
the line that goes `{pkgs, lib, ...}` at the top of a file) in your NixOS
configuration easily.

## Why would you need to extend `nixpkgs.lib`

While the library functions provided by nixpkgs is quite extensive and usually
suits my needs, I sometimes feel the need to define my own function or wrap an
existing function to complete a task. Normally we can handle the process of a
function inside a simple `let in` and be well off, but there may be times you
need to re-use the existing function across your configuration file. In such
times, you might want to either write your own lib and inherit it at the source
of your `flake.nix` to then inherit them across your configuration.

## Extending `nixpkgs.lib`

I find the easiest way of extending nixpkgs.lib to be using an "overlay",
enabled by `makeExtensible`. [^2]

```nix
# The file path is arbitrary, let's assume that this is in
# lib/default.nix for the sake of simplicity.
{
  inputs,
  ...
}: inputs.nixpkgs.lib.extend (
    final: prev: {
      # Your functions go here
    }
  )
```

The above structure takes the existing `lib` from `nixpkgs`, which you'll
remember is defined as `nixpkgs.lib`, and appends your own extensions to it. You
may then import this library in your `flake.nix` to pass it to other imports and
definitions.

```nix
# flake.nix
flake = let
  # Get the extended lib from ./lib/default.nix
  lib = import ./lib {inherit inputs;};
in {
  # Then you may pass it around, e.g. in imports by adding `lib`
  # to the argument set.
  nixosConfigurations = import ./hosts {inherit nixpkgs self lib;};
};
```

In this example, the extended library is imported from `lib/default.nix` in
repository root where the overlay is defined. It is then passed around to make
the extended `lib` available within all files called by `flake.nix`. For
example, in `hosts/default.nix` it could be added to `specialArgs` to make the
extended library the default in a NixOS configuration.

```nix
# hosts/default.nix
{lib, ...}: {
  # Since this is called by nixosConfigurations = ./import ...
  # we just add the configuration attributes here, one for each
  # new configuration.
  fooSystem = lib.nixosSystem {
    modules = [ ... ];
    specialArgs = {lib;};
  };
```

Now any and all new functions defined in the extended library will become
available in any files called by `modules`, thanks to `specialArgs`.

## Caveats

The problem with this approach is that it may be confusing for other people
reviewing your configuration. With this approach, `lib.customFunction` looks
identical to any lib function, which may lead to people thinking the function
exists in nixpkgs itself while it is only provided by your configuration. This
is not a problem per se, but if this is something that bothers you then the
solution is simple though. Instead of extending `nixpkgs.lib`, you may define
your own lib that does not inherit from `nixpkgs.lib` and only contains your
functions. The process would be similar, and you would not need to define an
overlay.

```nix
# flake.nix
flake = let
    # extended nixpkgs lib, contains my custom functions
    lib' = import ./lib {inherit nixpkgs lib inputs;};
in {
    # entry-point for nixos configurations
    nixosConfigurations = import ./hosts {inherit nixpkgs self lib';};
};
```

where your `lib/default.nix` looks like

```nix
# lib/default.nix
{nixpkgs, ...}: {
  # Define your functions here as you would do in an extension
}
```

## Example Implementations

If you have defined your own custom library based on this post, feel free to add
a project or your configuration as an example here.

- [nvf's extended library](https://github.com/NotAShelf/nvf/blob/main/lib/stdlib-extended.nix)
- [MicrOS](https://github.com/snugnug/micros/blob/50db7e1c8e1633566c43190976bf2f6ac43f12ff/flake.nix#L86)

[^1]: https://github.com/NixOS/nixpkgs/blob/03ae77ee2d193531819ae43711c8f168c7051e7b/nixos/lib/eval-config.nix#L32

[^2]: https://github.com/NixOS/nixpkgs/blob/03ae77ee2d193531819ae43711c8f168c7051e7b/lib/default.nix#L10C9-L10C22
