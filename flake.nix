{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  outputs = {
    nixpkgs,
    self,
    ...
  }: let
    inherit (nixpkgs) legacyPackages lib;

    systems = ["x86_64-linux" "aarch64-linux" "aarch64-darwin"];
    forEachSystem = lib.genAttrs systems;
    pkgsForEach = legacyPackages;
  in {
    formatter = forEachSystem (system: nixpkgs.legacyPackages.${system}.alejandra);

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = self.devShells.${system}.site;
      site = pkgs.callPackage ./nix/shell.nix {inherit self;};
    });

    packages = forEachSystem (system: let
      pkgs = pkgsForEach."${system}";
    in {
      default = self.packages.${system}.site;
      site = pkgs.callPackage ./nix/site.nix {inherit self;};
      ci = pkgs.callPackage ./nix/ci.nix {};
    });

    # Make sure that the packages and devshells are valid.
    checks = self.packages // self.devShells;
  };
}
