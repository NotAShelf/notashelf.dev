{
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
}:
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
}
