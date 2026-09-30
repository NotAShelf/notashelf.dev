{
  lib,
  stdenv,
  # Used to build the website package
  pnpm_11,
  nodejs,
  fetchPnpmDeps,
  pnpmConfigHook,
  buildDate,
  rev,
}: let
  pnpm' = pnpm_11;
in
  stdenv.mkDerivation (finalAttrs: {
    pname = "notashelf-dev";
    version = "0-unstable-${buildDate}";

    src = let
      fs = lib.fileset;
      sp = ../.;
    in
      fs.toSource {
        root = sp;

        # Filter everything outside of what's specified here. Configuration files
        # are good to include, but linter/formatter configs are not necessary.
        fileset = fs.unions [
          (sp + /apps)
          (sp + /content)
          (sp + /packages)
          (sp + /scripts)

          (sp + /package.json)
          (sp + /tsconfig.json)
          (sp + /pnpm-lock.yaml)
          (sp + /pnpm-workspace.yaml)
        ];
      };

    nativeCheckInputs = [
      nodejs
      pnpm'
    ];

    pnpmInstallFlags = ["--prod"]; # don't install dev dependencies

    # XXX: The amount of dependencies required to build this project are a little absurd.
    # If we could build just one workspace, we could also just specify a workspace here
    # to fetch deps for and build. Alas, NodeJS.
    pnpmDeps = fetchPnpmDeps {
      pnpm = pnpm';
      inherit (finalAttrs) pname src pnpmInstallFlags;
      hash = "sha256-d8kkkYyUNs5arjzyUJy2F+JkDhwxKv7Mb1VfWZ/B/Ho=";
      fetcherVersion = 4; # https://nixos.org/manual/nixpkgs/stable/#javascript-pnpm-fetcherVersion
    };

    nativeBuildInputs = [
      pnpm'
      pnpmConfigHook
      nodejs # build scripts require node :/
    ];

    buildPhase = ''
      runHook preBuild

      mkdir -p $out/share/web
      pnpm run build:web --outDir $out/share/web

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
      GIT_REV = rev;
    };

    meta = {
      description = "My personal website and blog built with Nix and Astro";
      homepage = "https://github.com/notashelf/notashelf.dev";
      license = lib.licenses.mpl20;
      maintainers = [lib.maintainers.NotAShelf];
    };
  })
