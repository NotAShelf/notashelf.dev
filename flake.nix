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
      default = self.packages.${system}.site;
      site = pkgs.callPackage ./nix/build-site.nix {inherit self;};
    });

    # Make sure that the packages and devshells are valid.
    checks = self.packages // self.devShells;
  };
}
