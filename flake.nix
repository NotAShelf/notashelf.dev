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
            else "dirty";

          src = let
            sp = ./.;
          in
            fs.toSource {
              root = sp;
              fileset = fs.intersection (fs.fromSource (lib.sources.cleanSource sp)) (
                fs.unions [
                  ./src
                  ./public
                  ./package.json
                  ./pnpm-lock.yaml
                  ./astro.config.ts
                ]
              );
            };

          pnpmDeps = pkgs.pnpm_10.fetchDeps {
            inherit (finalAttrs) pname src;
            hash = "sha256-RHBPXfUdKFHjXWY/OaaQ1vZ/Ha/aiQmzVyrYBtJqF7k=";
          };

          nativeBuildInputs = with pkgs; [
            git
            nodejs
            pnpm_10.configHook
          ];

          env = {
            ASTRO_TELEMETRY_DISABLED = true;
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
            license = lib.licenses.cc-by-nc-40;
            maintainers = [lib.maintainers.NotAShelf];
          };
        });
    });
  };
}
