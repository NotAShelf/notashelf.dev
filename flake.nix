{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

  outputs = {
    nixpkgs,
    self,
    ...
  }: let
    inherit (nixpkgs) legacyPackages lib;

    # Compose for multiple systems. Less systems seem to be reducing the eval duration
    # for, e.g., Direnv but more may be added as seen necessary. If I ever get a Mac...
    systems = ["x86_64-linux"];
    forEachSystem = lib.genAttrs systems;
    pkgsForEach = legacyPackages;
  in {
    formatter = forEachSystem (system: nixpkgs.legacyPackages.${system}.alejandra);

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = self.devShells.${system}.blog;
      blog = pkgs.mkShellNoCC {
        name = "blog-dev";
        packages = with pkgs; [
          # Eslint_d
          nodejs-slim
          pnpm

          # To run 'typos' on my content every once in a while
          typos
        ];
      };
    });

    packages = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      build-site = let
        fs = lib.fileset;
      in
        pkgs.stdenvNoCC.mkDerivation (finalAttrs: {
          pname = "build-site";
          version =
            if (self ? rev)
            then (builtins.substring 0 7 self.rev)
            else "main";

          src = let
            sp = ./.;
          in
            fs.toSource {
              root = sp;

              # Filter everything outside of what's specified here. Configuration files
              # are good to include, but linter/formatter configs are not necessary.
              fileset = fs.intersection (fs.fromSource (lib.sources.cleanSource sp)) (
                fs.unions [
                  ./src
                  ./public
                  ./posts
                  ./package.json
                  ./pnpm-lock.yaml
                  ./astro.config.ts
                  ./tsconfig.json # for import aliases
                ]
              );
            };

          pnpmDeps = pkgs.pnpm_10.fetchDeps {
            inherit (finalAttrs) pname src;
            hash = "sha256-2+huNoSaE0nHOu02Sv5vC+A+toEZMf0s/vMMTOyc17k=";
          };

          nativeBuildInputs = with pkgs; [
            nodejs
            pnpm_10.configHook
          ];

          env = {
            ASTRO_TELEMETRY_DISABLED = true;
            GIT_REV = finalAttrs.version;
            SITE_SRC = "https://github.com/notashelf/notashelf.dev";
          };

          buildPhase = ''
            runHook preBuild

            pnpm run build -- --standalone --disable-updater

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            cp -rvf dist $out

            runHook postInstall;
          '';

          meta = {
            description = "Pure, reproducible builder for my blog";
            maintainers = [lib.maintainers.NotAShelf];
          };
        });
    });

    # Make sure that the packages and devshells are valid.
    checks = self.packages // self.devShells;
  };
}
