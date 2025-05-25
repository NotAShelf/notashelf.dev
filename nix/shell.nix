{
  mkShell,
  nodejs-slim,
  pnpm,
  typos,
  cargo,
  rustc,
  rustfmt,
  wasm-pack,
  lld,
  ...
}:
mkShell {
  name = "blog-dev";
  packages = [
    # Eslint_d
    nodejs-slim
    pnpm

    # To run 'typos' on my content every once in a while
    typos

    # WASM
    cargo
    rustc
    rustfmt
    wasm-pack
    lld
  ];
}
