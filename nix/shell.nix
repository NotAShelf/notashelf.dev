{
  self,
  mkShell,
  # Node
  nodejs-slim,
  pnpm,
  # WASM
  cargo,
  rustc,
  rustfmt,
  wasm-pack,
  lld,
  # Testing/Linting
  typos,
  google-lighthouse,
  ...
}: let
  inherit (builtins) concatStringsSep match;
in
  mkShell {
    name = "blog-dev";
    packages = [
      # Websitee
      nodejs-slim
      pnpm

      # WASM
      cargo
      rustc
      rustfmt
      wasm-pack
      lld

      # To run 'typos' on my content every once in a while
      typos

      # Analytics
      google-lighthouse
    ];

    env = {
      BUILD_DATE = concatStringsSep "-" (match "(.{4})(.{2})(.{2}).*" self.lastModifiedDate);
    };
  }
