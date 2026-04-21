{
  self,
  lib,
  stdenv,
  # Used to build the website package
  pnpm,
  nodejs,
  fetchPnpmDeps,
  pnpmConfigHook,
}: let
  fs = lib.fileset;
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
      hash = "sha256-BYy34iBqnzUmwPFFgoToFKJWuRu2ncKEjvfu3FjV/Tk=";
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
