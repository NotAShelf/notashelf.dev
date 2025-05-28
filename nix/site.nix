{
  self,
  lib,
  stdenv,
  # Used to build the web package
  pnpm,
  nodejs,
  # Required for building WASM utilities
  rustPlatform,
  cargo,
  rustc,
  wasm-pack,
  wasm-bindgen-cli,
  lld,
  binaryen,
  ...
}: let
  fs = lib.fileset;

  wasmUtils = let
    cargoToml = builtins.fromTOML (builtins.readFile ../packages/wasm-utils/Cargo.toml);
    pname = cargoToml.package.name;
    version = cargoToml.package.version;
  in
    rustPlatform.buildRustPackage {
      inherit pname version;
      src = ../packages/wasm-utils;

      useFetchCargoVendor = true;

      nativeBuildInputs = [
        wasm-pack
        lld
        wasm-bindgen-cli
        binaryen
      ];

      copyLibs = true;

      doCheck = true;
      checkInputs = [
        cargo
        rustc
      ];

      cargoLock.lockFile = ../packages/wasm-utils/Cargo.lock;

      WASM_PACK_CACHE = ".wasm-pack-cache";

      postBuild = ''
        mkdir -p $out/lib
        wasm-pack build --release --target web --out-dir $out --out-name wasm-utils
      '';
    };
in
  stdenv.mkDerivation (finalAttrs: {
    pname = "build-site";
    version =
      if (self ? rev)
      then (builtins.substring 0 7 self.rev)
      else "main";

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
            ../package.json
            ../pnpm-lock.yaml
            ../pnpm-workspace.yaml
          ]
        );
      };

    pnpmDeps = pnpm.fetchDeps {
      inherit (finalAttrs) pname src;
      hash = "sha256-ZCLNRf0eo8RtvSlLbLRXLaMaKpMFGCDYxJ8X8DkbwRA=";
    };

    nativeBuildInputs = [
      nodejs
      pnpm.configHook

      cargo
      wasm-pack
    ];

    env = {
      ASTRO_TELEMETRY_DISABLED = true;
      GIT_REV = finalAttrs.version;
      SITE_SRC = "https://github.com/notashelf/notashelf.dev";
    };

    postPatch = ''
      # Create the expected directory structure and symlink to our built WASM utils
      mkdir -p packages/wasm-utils
      ln -sf ${wasmUtils} packages/wasm-utils/pkg
    '';

    buildPhase = ''
      runHook preBuild

      pnpm run build:web --outDir $out -- --standalone --disable-updater

      runHook postBuild
    '';

    meta = {
      description = "Pure, reproducible builder for my blog";
      maintainers = [lib.maintainers.NotAShelf];
    };
  })
