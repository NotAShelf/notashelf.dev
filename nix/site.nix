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

      env.WASM_PACK_CACHE = ".wasm-pack-cache";

      postBuild = ''
        mkdir -p $out/lib
        wasm-pack build --release --target web --out-dir $out --out-name wasm-utils
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
            ../package.json
            ../pnpm-lock.yaml
            ../pnpm-workspace.yaml
          ]
        );
      };

    pnpmDeps = pnpm.fetchDeps {
      inherit (finalAttrs) pname src;
      hash = "sha256-96CnHfEeP2wmAqzsk9DR47BjkeEsREm99nHhXiOV7cI=";
      fetcherVersion = 2; # https://nixos.org/manual/nixpkgs/stable/#javascript-pnpm-fetcherVersion
    };

    postPatch = ''
      # Create the expected directory structure and symlink to our built WASM utils
      mkdir -p packages/wasm-utils
      ln -sf ${wasmUtils} packages/wasm-utils/pkg
    '';

    nativeCheckInputs = [
      nodejs
      pnpm
    ];

    checkPhase = ''
      runHook preCheck

      pnpm run test:ci

      runHook postCheck
    '';

    nativeBuildInputs = [
      nodejs
      pnpm.configHook

      cargo
      wasm-pack
    ];

    buildPhase = ''
      runHook preBuild

      pnpm run build:web --outDir $out -- --standalone --disable-updater

      runHook postBuild
    '';

    env = {
      ASTRO_TELEMETRY_DISABLED = true;
      GIT_REV = finalAttrs.version;
      SITE_SRC = "https://github.com/notashelf/notashelf.dev";
      BUILD_DATE = buildDate;
    };

    meta = {
      description = "Pure, reproducible builder for my blog";
      maintainers = [lib.maintainers.NotAShelf];
    };
  })
