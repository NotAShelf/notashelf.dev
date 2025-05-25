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
      default = self.devShells.${system}.site;
      site = pkgs.callPackage ./nix/shell.nix {};
    });

    packages = forEachSystem (system: let
      pkgs = pkgsForEach."${system}";
    in {
<<<<<<< HEAD
      default = self.packages.${system}.build-site;
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
                  ./apps/web
                  ./packages/wasm
                  ./package.json
                  ./pnpm-lock.yaml
                  ./pnpm-workspace.yaml
                ]
              );
            };

          pnpmDeps = pkgs.pnpm_10.fetchDeps {
            inherit (finalAttrs) pname src;
            hash = "";
          };

          nativeBuildInputs = with pkgs; [
            nodejs
            pnpm_10.configHook

            cargo
            wasm-pack
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
||||||| parent of c59e354 (nix: fix build with WASM package)
      default = self.packages.${system}.build-site;
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
                  ./apps/web
                  ./packages/wasm
                  ./package.json
                  ./pnpm-lock.yaml
                  ./pnpm-workspace.yaml
                ]
              );
            };

          pnpmDeps = pkgs.pnpm_10.fetchDeps {
            inherit (finalAttrs) pname src;
            hash = "sha256-7MKBq4VrOosV/XLWgbVtAUvFB1YCMjepRolez3rfqmA=";
          };

          nativeBuildInputs = with pkgs; [
            nodejs
            pnpm_10.configHook

            cargo
            wasm-pack
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
=======
      default = self.packages.${system}.site;
      site = pkgs.callPackage ./nix/build-site.nix {inherit self;};
>>>>>>> c59e354 (nix: fix build with WASM package)
    });

    # Make sure that the packages and devshells are valid.
    checks = self.packages // self.devShells;
  };
}
