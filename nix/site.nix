{
  self,
  lib,
  stdenv,
  # Used to build the website package
  pnpm,
  nodejs,
  fetchPnpmDeps,
  pnpmConfigHook,
  # Required for building WASM utilities
  rustPlatform,
  cargo,
  rustc,
  wasm-pack,
  lld,
  binaryen,
  wasm-bindgen-cli_0_2_106,
}: let
  fs = lib.fileset;

  wasmUtils = let
    cargoToml = lib.importTOML ../packages/wasm-utils/Cargo.toml;
    pname = cargoToml.package.name;
    version = cargoToml.package.version;
  in
    rustPlatform.buildRustPackage {
      inherit pname version;
      src = let
        sp = ../packages/wasm-utils;
      in
        fs.toSource {
          root = sp;
          fileset = fs.intersection (fs.fromSource (lib.sources.cleanSource sp)) (
            fs.unions [
              (sp + /src)

              (sp + /Cargo.toml)
              (sp + /Cargo.lock)
            ]
          );
        };

      nativeBuildInputs = [
        wasm-pack
        lld
        binaryen
        wasm-bindgen-cli_0_2_106
      ];

      copyLibs = true;
      doCheck = true;
      checkInputs = [cargo rustc];

      cargoLock.lockFile = ../packages/wasm-utils/Cargo.lock;

      env.WASM_PACK_CACHE = ".wasm-pack-cache";

      postBuild = ''
        mkdir -p $out/lib
        wasm-pack build --release --target web \
          --out-dir $out --out-name wasm-utils
      '';
    };

  buildDate = builtins.concatStringsSep "-" (builtins.match "(.{4})(.{2})(.{2}).*" self.lastModifiedDate);
in
  stdenv.mkDerivation (finalAttrs: {
    pname = "notashelf-dev";
    version =
      if (self ? rev)
      then (builtins.substring 0 7 self.rev)
      else buildDate;

    src = let
      sp = ../.;
    in
      fs.toSource {
        root = sp;

        # Filter everything outside of what's specified here. Configuration files
        # are good to include, but linter/formatter configs are not necessary.
        fileset = fs.intersection (fs.fromSource (lib.sources.cleanSource sp)) (
          fs.unions [
            ../apps
            ../packages
            ../scripts

            ../package.json
            ../tsconfig.json
            ../pnpm-lock.yaml
            ../pnpm-workspace.yaml
          ]
        );
      };

    # PNPM expects WASM utilities inside packages/wasm-utils/pkgs, however, we
    # cannot tell it to look at the Nix build output of wasm-utils package.
    # Instead we create the expected directory structure, and symlink to our
    # WASM utilities build output.
    postPatch = ''
      mkdir -p packages/wasm-utils
      ln -sf ${wasmUtils.outPath} packages/wasm-utils/pkg
    '';

    nativeCheckInputs = [
      nodejs
      pnpm
    ];

    pnpmInstallFlags = ["--prod"]; # don't install dev dependencies

    # XXX: The amount of dependencies required to build this project are a little absurd.
    # If we could build just one workspace, we could also just specify a workspace here
    # to fetch deps for and build. Alas, NodeJS.
    pnpmDeps = fetchPnpmDeps {
      inherit (finalAttrs) pname src pnpmInstallFlags;
      hash = "sha256-Dqxfod9Y1+59Pep5A01F3soPndbbG/wwZnMmbfPe1P0=";
      fetcherVersion = 3; # https://nixos.org/manual/nixpkgs/stable/#javascript-pnpm-fetcherVersion
    };

    nativeBuildInputs = [
      pnpm
      pnpmConfigHook
      nodejs # build scripts require node :/
    ];

    buildPhase = ''
      runHook preBuild

      pnpm run build:web --outDir $out

      runHook postBuild
    '';

    checkPhase = ''
      runHook preCheck

      pnpm run test:ci

      runHook postCheck
    '';

    # Env is the cleanest way we can pass data to Astro during build time. It
    # is primarily used to inform the Nix-sandboxed build of data that it would
    # normally have access to, such as the current date.
    env = {
      ASTRO_TELEMETRY_DISABLED = true;
      SITE_SRC = "https://github.com/notashelf/notashelf.dev";
      BUILD_DATE = buildDate;
      GIT_REV = finalAttrs.version;
    };

    meta = {
      description = "My personal website and blog built with Nix and Astro";
      homepage = "https://github.com/notashelf/notashelf.dev";
      license = lib.licenses.mpl20;
      maintainers = [lib.maintainers.NotAShelf];
    };
  })
