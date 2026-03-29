{
  self,
  mkShell,
  # Node
  nodejs-slim,
  pnpm,
  taplo,
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
      # Website
      nodejs-slim
      pnpm

      # TOML formatting
      taplo

      # To run 'typos' on my content every once in a while
      typos

      # Analytics
      google-lighthouse
    ];

    env.BUILD_DATE = concatStringsSep "-" (match "(.{4})(.{2})(.{2}).*" self.lastModifiedDate);
  }
