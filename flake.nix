{
  inputs.nixpkgs.url = "https://channels.nixos.org/nixos-unstable/nixexprs.tar.zst";
  outputs = {
    nixpkgs,
    self,
    ...
  }: let
    inherit (nixpkgs) legacyPackages lib;

    systems = ["x86_64-linux" "aarch64-linux" "aarch64-darwin"];
    forEachSystem = lib.genAttrs systems;
    pkgsForEach = legacyPackages;

    buildDate = builtins.concatStringsSep "-" (builtins.match "(.{4})(.{2})(.{2}).*" self.lastModifiedDate);
    rev = self.rev or self.dirtyRev;
  in {
    formatter = forEachSystem (system: nixpkgs.legacyPackages.${system}.alejandra);

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = pkgs.callPackage ./nix/shell.nix {};
    });

    packages = forEachSystem (system: let
      pkgs = pkgsForEach."${system}";
    in {
      default = self.packages.${system}.site;
      site = pkgs.callPackage ./nix/site.nix {inherit buildDate rev;};
      ci = pkgs.callPackage ./nix/ci.nix {};
    });

    # Make sure that the packages and devshells are valid.
    checks = self.packages // self.devShells;
  };
}
