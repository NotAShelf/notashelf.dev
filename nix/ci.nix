{
  writeShellApplication,
  nodejs,
  pnpm,
  eslint,
  rustc,
  cargo,
  wasm-pack,
  wasm-bindgen-cli,
  binaryen,
  lld,
}:
writeShellApplication {
  name = "ci";
  runtimeInputs = [
    nodejs
    pnpm
    eslint
    rustc
    cargo
    wasm-pack
    wasm-bindgen-cli
    binaryen
    lld
  ];
  text = ''
    set -euo pipefail

    error_exit() {
      echo "ERROR: $1" >&2
      exit 1
    }

    # Print environment info for debugging
    echo "Node version: $(node --version)"
    echo "PNPM version: $(pnpm --version)"
    echo "Rust version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
    echo "Working directory: $(pwd)"

    # Install dependencies with CI-optimized flags
    echo "Installing dependencies..."
    pnpm install \
      --frozen-lockfile --strict-peer-dependencies --recursive --prefer-offline  || error_exit "Failed to install dependencies."

    # Formatting checks
    echo "Running format checks..."
    pnpm run fmt --check || error_exit "Code formatting check failed."

    # Build WASM utilities
    echo "Building WASM utilities..."
    pnpm run build:wasm-utils || error_exit "WASM build failed."

    # Linting and type checking
    echo "Running lints..."
    pnpm run lint || error_exit "Linting failed."

    echo "Running type checks..."
    pnpm run check || error_exit "Type checking failed."

    # Run tests with CI configuration
    echo "Running tests..."
    pnpm run test:ci || error_exit "Tests failed."

    echo "CI pipeline completed successfully"
  '';
}
