---
title: "Building Deterministic Typst Packages with Nix"
description: "Every time I think to myself 'no way Nix can do this,' Nix does it anyway."
date: 2025-03-17
keywords: ["tutorial", "nix", "software"]
---

# Building Deterministic Typst Packages with Nix

[Typst Builder PR]: https://github.com/NixOS/nixpkgs/pull/369283

Recently, I encountered a [Typst Builder PR] in Nixpkgs that implements a Typst
builder, similar to other language-specific builders you might be familiar with.

While I still use Pandoc and Markdown for many tasks (including this blog), I've
been using [Typst](https://typst.app) extensively recently, and that got me
excited to explore the new builder(s).

To test them, and possibly demonstrate their functionality, I've prepared the
following `flake.nix`:

```nix
{
  inputs.nixpkgs.url = "github:cherrypiejam/nixpkgs?ref=typst";
  outputs = {nixpkgs, ...}: let
    systems = ["x86_64-linux"];
    forEachSystem = nixpkgs.lib.genAttrs systems;

    pkgsForEach = nixpkgs.legacyPackages;
  in {
    packages = forEachSystem (system: {
      inherit (pkgsForEach.${system}) buildTypstPackage typstPackages;
    });

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = pkgs.mkShellNoCC {
        # packages provided in 'nix develop'
        packages = [
          (pkgs.typst.withPackages (ps:
            with ps; [
              polylux
              cetz_0_3_0
            ]))
        ];
      };
    });
  };
}
```

This flake re-exports `buildTypstPackage` and `typstPackages` from nixpkgs and
uses the new `typst.withPackages` scope to create a deterministic Typst
environment. Its usage, though subject to change, appears straightforward.

`buildTypstPackage` produces a "manifest" of available Typst packages from Typst
Universe, which you can use within `typst.withPackages`'s scope. For example:

```nix
typst.withPackages (ps:
 with ps; [
    polylux
    cetz
 ])
);
```

This allows you to use, for instance, `#import "@preview/cetz:0.3.0: \*"` as
cetz is added to Typst's search path via the `TYPST_PACKAGE_CACHE_PATH` variable
set to, e.g.,
`/nix/store/02pgr69nc5lczi9rrh2xd40s1mzqrvkl-typst-0.13.1-env/lib/typst/packages`,
populated with the packages in your scope.

## Closing Thoughts

I encourage you to review the [Typst Builder PR]. It seems nearly ready and will
likely be included in nixpkgs soon. If you want to try it out now, consider
examining the example flake I've provided above.
