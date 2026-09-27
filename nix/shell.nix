{
  mkShell,
  # Node
  nodejs-slim,
  pnpm_11,
  taplo,
  # Testing/Linting
  typos,
  google-lighthouse,
  ...
}: let
  pnpm' = pnpm_11;
in
  mkShell {
    name = "blog-dev";
    packages = [
      # Website
      nodejs-slim
      pnpm'

      # TOML formatting
      taplo

      # To run 'typos' on my content every once in a while
      typos

      # Analytics
      google-lighthouse
    ];
  }
