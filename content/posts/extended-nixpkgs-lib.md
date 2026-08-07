---
title: "When, Why and How to Extend Nixpkgs' Standard Library"
description: "Reasons why and how you might create your own extended library"
date: 2025-02-01
updated: 2026-07-31
keywords: ["nix", "nixpkgs", "tutorial"]
---

If you've ever used Nix/NixOS to a certain extent, perhaps one where you can
call yourself "proficient", you might have needed to write your own custom
functions, "store" them somewhere, and pass them around. While it is
conceptually possible and _rather easy_ to define them inside your files'
`let in` blocks for one-off usages, or to stick them in your system
configuration's argument set via `specialArgs` in the context of a NixOS
configuration there are ways I find easier and more ergonomic.

## What is `nixpkgs.lib`?

`nixpkgs.lib`, in the context of Nix/OS, refers to either `<nixpkgs/lib>` (if
you're using channels) or the `lib` output of Nixpkgs' `flake.nix` exposed as a
part of the "experimental" interface.. It's a collection of helpful functions
and other goodies designed around usage in Nixpkgs and overall filling the gap
left by Nix's builtins. I.e., you can do a lot of things in Nix by using the
Nixpkgs library when `builtins` fall short. We use those functions everywhere.
We make use of them in Nixpkgs---in packages and modules alike---, we use them
in our NixOS configurations and in random pet projects we've created for Nix.
Point is that they're almost impossible to live by unless you really like
reinventing the wheel.

On top of being available as a flake output and a top-level attribute as
`nixpkgs.lib`, it's also propagated to your system's `pkgs` and even `config`.
When you are using `lib.nixosSystem`, you're actually just calling
`lib.evalModules` under the hood and the `lib` attribute is added to your
system's `specialArgs`[^1] so that you can add it to the argument set (i.e., the
line that goes `{pkgs, lib, ...}` at the top of a file) in your NixOS
configurations.

[^1]: <https://github.com/NixOS/nixpkgs/blob/03ae77ee2d193531819ae43711c8f168c7051e7b/nixos/lib/eval-config.nix#L32>

## Why would you need to extend `nixpkgs.lib`

While the library functions provided by Nixpkgs are _quite_ robust and the
library interface is rather extensive I, like many other users, sometimes feel
the need to define my own functions to do something specific or wrap an existing
function from Nixpkgs' library to invoke it in a particular way that suits my
project better. Normally we can handle the process of a function inside a simple
`let in` and be well off, but there may be times you need to re-use the existing
function across your configuration file. In such cases, you really have three
options. We'll call it _two_ options because the third one is ugly.

One option is, well, to extend `nixpkgs.lib`. You can do it easily, because the
library helpfully uses `lib.makeExtensible`, so we can trivially extend it. Now,
I'd like for you to know that Nixpkgs **does not want you to use this
interface**. They call it "a mistake" and provide this warning in
`lib/default.nix`:

<!--markdownlint-disable MD013-->

```md
:::{.warning} This functionality is intended as an escape hatch for when the
provided version of the Nixpkgs library has a flaw.

If you were to use it to add new functionality, you will run into compatibility
and interoperability issues. :::
```

<!--markdownlint-enable MD013-->

First and foremost, this is a bogus warning. It uses handwavy, vague language
because either the author has no idea what they're warning against or they think
they're too important to explain to you what "compatibility and interoperability
issues" mean.

Some of you might want to _heed_ this warning though, so let's consider the
alternative options. If you don't want to use `lib.extend`, then you can very
trivially define your own custom library in, e.g., your `flake.nix` or
`system.nix` where you invoke `nixosSystem` and pass it to `specialArgs` with a
name that you like. I've come to observe that a lot of people prefer `lib'` or
something like `my` to name their custom libraries. We'll cover this [later in
this post], so you might just skip the next part if you do _not_ want to extend
Nixpkgs.

## Extending `nixpkgs.lib`

In my experience the easiest way of having your own custom library is to extend
`nixpkgs.lib` using an overlay, enabled by `makeExtensible`. [^2] This provides
access to all Nixpkgs library functions, and is an easy way of simply making
sure your `lib` is consistent everywhere. You do, however, **have to be careful
about name collisions**.

[^2]: <https://github.com/NixOS/nixpkgs/blob/03ae77ee2d193531819ae43711c8f168c7051e7b/lib/default.nix#L10C9-L10C22>

Start by creating a file where you'll define your new functions. The path is
arbitrary, but for brevity let us assume it's in `lib/default.nix` located in
your configuration repository. It'll look something like this at the start:

```nix
# lib/default.nix
{
  nixpkgs,
  ...
}: nixpkgs.lib.extend (
    final: prev: {
      # Your functions go here
    }
  )
```

In this example I'll assume you use flakes, but for the sake of non-flakes
compatibility I've elected to pass `nixpkgs` directly to the entrypoint. If you
want to extend your already-extended library with functions from, e.g., flake
inputs then you may replace `nixpkgs` with `inputs.nixpkgs` and simply pass
`inputs` to this file instead of Nixpkgs.

The above structure takes the existing `lib` from `nixpkgs`, which you'll
remember is defined as `nixpkgs.lib`, and appends your own extensions to it. You
may then import this library in your `flake.nix` (or `system.nix` in NixOS 26.05
or above) to pass it to other imports and definitions.

```nix
# flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... } @ inputs: {
    nixosConfigurations = let
      # We'll import the extended library from ./lib/default.nix. Since we "destructure"
      # inputs above this line, we can access `inputs.nixpkgs` as just `nixpkgs`
      # inside this scope. You can also pass `inputs` directly.
      lib = import ./lib {inherit nixpkgs;};
    in
      # Now your invocation of `lib` becomes the extended one, but you must
      # pass it to `nixosSystem`, which we'll put in hosts/default.nix for
      # the sake of organization. You can, of course, just put the entire
      # `nixosConfigurations = { ... }` block here.
      nixosConfigurations = import ./hosts {inherit lib;};
  };
}
```

In this example, the extended library is imported from `lib/default.nix` in
repository root where the overlay is defined. It is then passed around to make
the extended `lib` available within all files called by `flake.nix`. For
example, in `hosts/default.nix` it could be added to `specialArgs` to make the
extended library the default in a NixOS configuration.

```nix
# hosts/default.nix
{lib, ...}: {
  # Since this file is called by `nixosConfigurations = ./import ...` we only
  # add the key-value pairs, i.e., `hostname = lib.nixosSystem { ... }. One
  # for each new configuration.
  fooSystem = lib.nixosSystem {
    specialArgs = {inherit lib;}; # pass your extended lib to all imported modules

    # Any module here will be able to
    modules = [
      # This is an example of an inline module. You can move the content
      # below to, e.g., a `hostname.nix` file and just import it here as
      # a path like `modules = [ ./hostname.nix ];` where `hostname.nix`
      # contains the below module *without parenthesis*.
      ({lib, ...}: {
        # Let's assume your extended library has a custom myHostname function
        # that returns, well, your desired hostname.
        networking.hostname = lib.myHostname; # <- this is from the extended lib
      })
    ];
  };
}
```

Now any and all new functions defined in your extended library will become
available in any files "called by", i.e., evaluated by `modules` thanks to
`specialArgs`. You can even use it to define your own wrapper around
`lib.evalModules`, which is what `lib.nixosSystem` does, and just make sure your
custom function, e.g., `lib.makeEpicSystem` (cool name I know) automatically
passes the `lib` in-place.

### Caveats

Naturally, there are some caveats with extending Nixpkgs library. While I've
discarded the warning, it's not unlikely that you'll run into issues. This is a
powerful method that I find silly to handwave away, but it's also fragile. The
biggest problem, however, is that it'll make it _for other people to read your
configuration_. With this approach, `lib.customFunction` looks identical to any
lib function, which may lead to people thinking the function exists in nixpkgs
itself while it is only provided by your configuration. This is not a problem
_per se_, but if this is something that bothers you then the solution is simple
enough. Instead of extending `nixpkgs.lib`, you may define your own custom lib
that does not inherit from `nixpkgs.lib`, but only contains your functions. The
process would be similar, and you would not need to define an overlay.

## Defining your own library

```nix
# flake.nix
flake = let
    
in {
    # entry-point for nixos configurations
    nixosConfigurations = import ./hosts {inherit nixpkgs self lib';};
};

# flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... } @ inputs: {
    nixosConfigurations = let
      # This time you're only passing `nixpkgs` around so that you can use
      # Nixpkgs' lib in your custom library, but this time without extending
      # it.
      lib' = import ./lib {inherit nixpkgs;};
    in
      # You can still pass `lib'` around and put it in `specialArgs` to
      # make it available in your configuration. We'll still need to get
      # nixosSystem from lib, unless you define your own function to define
      # a NixOS system.
      nixosConfigurations = import ./hosts {inherit nixpkgs lib';};
  };
}
```

Now your `lib/default.nix` looks much more simple.

```nix
# lib/default.nix
{nixpkgs, ...}: {
  # Define your functions here as you would do in an extension. For example, let's
  # add that basic myHostname function here.
  myHostname = "myHostname";

  # Alternatively, let's make an actual *function*
  myHostnameFancy = prefix: "${prefix}hostname"; # takes a prefix argument
}
```

Now you can use them around your NixOS configuration and enjoy your custom
functions.

## Example Implementations

If you have defined your own custom library based on this post, feel free to add
a project or your configuration as an example here.

- [nvf's extended library](https://github.com/NotAShelf/nvf/blob/main/lib/stdlib-extended.nix)
- [MicrOS](https://github.com/snugnug/micros/blob/50db7e1c8e1633566c43190976bf2f6ac43f12ff/flake.nix#L86)
