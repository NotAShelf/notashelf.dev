---
title: "The Nihilist's Guide to Cross-Compiling Dioxus for Windows"
date: 2026-02-01
description: "One Stack to Rule Them All"
keywords: ["programming", "software", "guide"]
---

The Rust GUI ecosystem has matured into a landscape of impressive, specialized
tools. If you need immediate-mode simplicity, you reach for egui; if you want an
Elm-inspired architecture, you go with Iced; and for raw, GPU-accelerated
performance, GPUI is pushing the boundaries of what’s possible.

Choosing Dioxus in this environment wasn't really about a _lack of options_, so
to speak, but about leveraging a specific, battle-tested paradigm that I have
been interested in for a while now. It is a framework that allows developers to
bring the declarative "hooks and components" model and the entire CSS/Tailwind
ecosystem into a native context, effectively bridging the gap between
high-velocity web development and the efficiency of a Rust backend.

In the case you didn't know, I come from a frontend background. As such, I
expected to be _right at home_ when I started with Dioxus. I was not wrong.

## Why Dioxus

Admittedly, Dioxus occupies a very odd niche at a superficial level. It is
neither a traditional, retained-mode native GUI toolkit nor a thin
immediate-mode layer over a GPU abstraction. It (unapologetically) embraces the
mental model of modern frontend development: declarative components,
unidirectional data flow, and side effects expressed explicitly through hooks.

The choice, of course, is not about novelty. The hooks and components paradigm
has already been stress-tested at a planetary scale by the web. Its strengths
and weaknesses are very well understood, its ergonomics have been refined
through years of iteration, and its failure modes are similar. By importing that
model wholesale into Rust, Dioxus allows you to reuse not just _ideas_, but
instincts. At least if you've written for the web before. State lives where you
expect it to live. Effects run when dependencies change. UI becomes a pure
function of state, with impurity carefully fenced off.

Dioxus' website will brandish itself a little differently, and talk about
various advantages that may or may not convince you. One of those advantages is
the one-stack-for-all you gain with Rust and being able to compile for many
targets but I'd like to state out loud the quiet part, which is velocity without
chaos. Compared to egui, you trade immediate-mode simplicity for structural
clarity once applications grow beyond a single window. Compared to Iced, you
give up strict Elm-style purity in exchange for a model that tolerates
real-world side effects without contortions. And compared to GPU-first
experiments like GPUI, you accept a webview boundary in return for a mature
layout engine, a ubiquitous styling language, and an ecosystem of tooling that
already knows how to scale.

For someone coming from a frontend background, this is less a paradigm shift
than a homecoming. CSS is not an afterthought. Accessibility semantics exist by
default. Layout is expressive rather than imperative. Tailwind, for better or
worse, works exactly the way you expect it to. The result is a framework that
lets you spend your time thinking about application behavior instead of fighting
your UI toolkit.

Dioxus is not the lowest-level option, nor the most ideologically pure. It is,
however, a pragmatic synthesis: Rust’s safety and performance paired with a UI
model that has already survived contact with reality.

Just as importantly, it is one of the few frameworks in the Rust ecosystem that
treats cross-platform delivery as a first-class concern. The same component tree
can target the web, Linux, macOS, and Windows with minimal structural
divergence, which makes it possible to develop primarily on Linux without
relegating other platforms to second-class status.

## Building with Dioxus

### Enter: Webview

The decision to use a system webview carries a hidden cost that becomes
painfully apparent the moment you try to ship. Because Dioxus on Windows relies
on WebView2, you are no longer _just_ compiling Rust; you are orchestrating a
complex interaction with proprietary Microsoft loaders and COM interfaces. For
those of us who prefer the deterministic, reproducible world of a Linux-based
Nix environment, this creates a significant engineering challenge. You cannot
simply cargo build your way out of a cross-compilation task that requires
official Windows SDK headers and proprietary DLLs.

To bridge this gap professionally, you have to bypass the standard
cross-compilation shortcuts and target the MSVC (Microsoft Visual C++) toolchain
directly from Linux. While MinGW is often the "default" for cross-compiling, it
frequently struggles with the specific nuances of the WebView2 SDK. By using
cargo-xwin, you can fetch the actual Windows CRT and SDK headers into a local
cache, allowing you to treat Windows as a first-class citizen of your build
pipeline.

### The Nix Way

The process begins by teaching Nix how to handle the proprietary Microsoft
artifacts. Since Nix sandboxes prevent build scripts from reaching out to the
internet, you must define a fixed-output derivation that fetches the official
WebView2 NuGet package and extracts the necessary `.lib` and `.dll` files. This
ensures that your build remains reproducible and that your linker has exactly
what it needs to satisfy the Windows-specific dependencies of the `wry` and
`tao` crates. My derivation looks something like:

```nix
# webview.nix
{
  stdenv,
  fetchurl,
  unzip,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "webview2-sdk";
  version = "1.0.3650.58";

  src = fetchurl {
    url = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/${finalAttrs.version}";
    sha256 = "sha256-kRpHISjIKsi6oMSGwjNCzJ3W59xQ11TmdnJmQsoGXGA=";
  };

  nativeBuildInputs = [unzip];

  unpackPhase = ''
    unzip $src
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out

    # Copy the x64 libraries (we can use x86 for 32-bit targets)
    install -Dm755 build/native/x64/WebView2Loader.dll.lib $out/WebView2Loader.lib
    install -Dm755 build/native/x64/WebView2Loader.dll $out/
    runHook postInstall
  '';

})
```

It could be better, but I have gotten sick of trying to get the correct URL and
loading the WebView runtime in Wine (which we'll talk about shortly.)

Once the SDK is available, you have to perform what is essentially environment
surgery within your Nix devShell. The standard Nix clang wrapper is designed for
Unix-style purity and will often reject the Windows-specific flags that
cargo-xwin and MSVC-compatible crates expect. To solve this, you must explicitly
direct Cargo to use `lld-link` as the linker and `clang-cl` as the C compiler.
This configuration ensures that even complex C dependencies, such as SQLite, are
compiled with the correct Windows headers and linked without flavor-mismatch
errors.

Furthermore, you must account for the fact that a compiled Windows executable is
functionally useless if it cannot find its dependencies at runtime. Unlike
Linux, where we can often rely on package managers or rpath, Windows expects the
`WebView2Loader.dll` to be present in the same directory as the `.exe` if it
cannot be loaded from the runtime. A robust pipeline automates this by using a
`build.rs` script that detects the Nix environment and copies the DLL from the
Nix store into the target directory every time a build succeeds.

```rust
// build.rs
fn main() {
    let target = std::env::var("TARGET").unwrap_or_default();
    if target.contains("windows-msvc") {
        if let Ok(sdk_path) = std::env::var("WEBVIEW2_BIN_PATH") {
            let dll = "WebView2Loader.dll";
            let src = std::path::PathBuf::from(&sdk_path).join(dll);
            let out_dir = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
            let dest = out_dir.ancestors().nth(3).unwrap().join(dll);
            if src.exists() {
                std::fs::copy(&src, &dest).expect("Failed to bundle WebView2Loader.dll");
            }
        }
        println!("cargo:rerun-if-env-changed=WEBVIEW2_BIN_PATH");
    }
}
```

## The Final Devshell

I have crafted an intricate devshell that pulls in various tools, and sets up a
modern Clang-based compiler and linker pipeline to handle my builds.

```nix
{
  pkgs,
  rust-bin,
  # rust-overlay params
  extraComponents ? [],
  extraTargets ? [],
}: let
  webview2-sdk = pkgs.callPackage ./packages/webview.nix {};
in
  pkgs.mkShell {
    name = "mercant-dev";
    packages = [
      pkgs.taplo # TOML formatter
      pkgs.lldb # debugger
      pkgs.rust-analyzer-unwrapped # LSP
      pkgs.llvm
      pkgs.libiconv

      # Additional Cargo Tooling
      pkgs.cargo-nextest
      pkgs.cargo-deny

      # Build tools
      # We use the rust-overlay to get the stable Rust toolchain for various targets.
      # This is not exactly necessary, but it allows for compiling for various targets
      # with the least amount of friction.
      (rust-bin.nightly.latest.default.override {
        extensions = ["rustfmt" "rust-analyzer" "clippy"] ++ extraComponents;
        targets =
          [
            "arm-unknown-linux-gnueabihf" # Android
            "wasm32-unknown-unknown" # web
            # Windows
            "x86_64-pc-windows-msvc"
            "x86_64-pc-windows-gnu"
          ]
          ++ extraTargets;
      })

      # Cross-compiling to Windows
      pkgs.pkgsCross.mingwW64.stdenv.cc
      pkgs.pkgsCross.mingwW64.buildPackages.gcc
      pkgs.cargo-xwin

      # Link with Clang & lld
      pkgs.clang
      pkgs.lld

      # Handy CLI for packaging Dioxus apps and such
      pkgs.dioxus-cli

      # Dioxus desktop dependencies (GTK/WebKit)
      pkgs.pkg-config
      pkgs.glib
      pkgs.gtk3
      pkgs.webkitgtk_4_1
      pkgs.libsoup_3
      pkgs.cairo
      pkgs.pango
      pkgs.gdk-pixbuf
      pkgs.atk
      pkgs.xdotool # provides libxdo
      pkgs.openssl
      pkgs.kdePackages.wayland
    ];

    env = let
      mcfgthread = pkgs.pkgsCross.mingwW64.windows.mcfgthreads;
    in {
      # Allow Cargo to use lld and clang properly
      LIBCLANG_PATH = "${pkgs.libclang.lib}/lib";
      RUSTFLAGS = "-C link-arg=-fuse-ld=lld";

      # Windows cross-comp
      WEBVIEW2_BIN_PATH = "${webview2-sdk}/lib";

      CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS = "-L native=${mcfgthread}/lib";
      CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_RUSTFLAGS = "-L native=${webview2-sdk}/lib";
      CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER = "lld-link";

      CC_x86_64_pc_windows_gnu = "x86_64-w64-mingw32-gcc";
      CXX_x86_64_pc_windows_gnu = "x86_64-w64-mingw32-g++";
      CC_x86_64_pc_windows_msvc = "clang-cl";
      AR_x86_64_pc_windows_msvc = "llvm-lib";

      # 'cargo llvm-cov' reads these environment variables to find these
      # binaries, which are needed to run the tests.
      LLVM_COV = "${pkgs.llvm}/bin/llvm-cov";
      LLVM_PROFDATA = "${pkgs.llvm}/bin/llvm-profdata";

      # Runtime library path for GTK/WebKit/xdotool
      LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath [
        pkgs.xdotool
        pkgs.gtk3
        pkgs.webkitgtk_4_1
        pkgs.glib
        pkgs.cairo
        pkgs.pango
        pkgs.gdk-pixbuf
        pkgs.atk
        pkgs.libsoup_3
        pkgs.openssl
        pkgs.kdePackages.wayland
      ]}";
    };
  }
```

## Metadata and Identity

By the time you drop into your shell and execute
`cargo xwin build --release --target x86_64-pc-windows-msvc`, you are no longer
fighting the toolchain. You have built a deterministic machine that translates
your Rust source code into a native, high-fidelity Windows binary. This approach
respects both the strict requirements of the Windows OS and the reproducible
philosophy of Nix, resulting in a distribution workflow that is as clean as the
code it compiles. The `WEBVIEW2_BIN_PATH` variable comes from our devShell,
which sets various environment variables for the tooling.

## Wine Tasting

Before arriving at this setup, it is tempting to try to paper over the problem
by simply running the Windows pieces under Wine. After all, if Dioxus ultimately
depends on WebView2, and WebView2 depends on the Edge runtime, why not just
install the runtime into a Wine prefix and let everything discover it
implicitly?

That line of reasoning leads you to commands like:

```powershell
wine MicrosoftEdgeWebView2RuntimeInstallerX86.exe /install
```

And yes, this does install the runtime. But it does not actually solve the
underlying problem.

WebView2 is split across multiple layers: a runtime installed system-wide, a
loader DLL that applications link against, and a set of COM interfaces that
assume a Windows loader, registry, and activation model. Wine can approximate
enough of this environment to allow some binaries to start, but it cannot make
those assumptions disappear. From the perspective of a cross-compiling Linux
toolchain, Wine is still an opaque, mutable black box. _More importantly_, Wine
does nothing for the build itself. Your Rust code still needs headers, import
libraries, and a linker that understands MSVC semantics. Installing the runtime
under Wine gives you a way to run a finished executable for ad-hoc testing, but
it does not help Cargo or rustc produce that executable in the first place. At
best, it delays failure until runtime. At worst, it masks missing dependencies
behind Wine-specific behavior that will not exist on a real Windows system.

This is why the Wine approach ultimately gets abandoned here. It trades a hard
but explicit problem for a soft, implicit one. By pulling the SDK artifacts
directly into Nix and targeting MSVC properly, you surface the real constraints
early, make them reproducible, and stop relying on an emulation layer as an
undocumented part of your build pipeline.

If you're lucky, the correct runtime will be installed out-of-the-box in your
_real_ Windows machine. You may or may not have the same luck for Wine.
Something like `winetricks corefonts windowscodecs` might come in handy but I've
ultimately stopped trying to get Wine to work, and booted into Windows on my
work machine.

## Conclusion

Cross-compiling a Dioxus application for Windows from a Nix-based Linux
environment is not difficult in the sense of missing tools or undocumented
hacks. It is difficult because it forces you to reconcile two fundamentally
different worldviews. Windows assumes mutable global state, opaque SDKs, and
proprietary loaders. Nix assumes hermetic builds, explicit inputs, and
reproducibility as a first principle.

The approach outlined here does not attempt to smooth over that mismatch.
Instead, it accepts Windows on its own terms by using the MSVC toolchain and
official SDK artifacts, while forcing those artifacts into Nix’s deterministic
model through fixed-output derivations and explicit environment wiring.
cargo-xwin acts as the linchpin, turning what would otherwise be an ad-hoc
Wine-based mess into a repeatable, cacheable build step.

The result is not just a working executable, but a pipeline you can reason
about. Every DLL is accounted for. Every header comes from a known source. Every
build either succeeds deterministically or fails loudly. That matters,
especially when you are shipping a GUI application whose failure modes tend to
surface at runtime rather than compile time.

In the end, this is less about Dioxus specifically and more about refusing false
dichotomies. You do not have to choose between modern UI paradigms and native
binaries. You do not have to choose between Windows support and a sane
Linux-based workflow. With enough stubbornness and a willingness to engage with
the toolchains honestly, you can have all of it, and you can make it
reproducible. The nihilism, such as it is, lies in accepting Windows not as a
system to be admired, but as a constraint to be modeled precisely and without
illusion.

Be well.
