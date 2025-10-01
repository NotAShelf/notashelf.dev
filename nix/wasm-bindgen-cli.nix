{
  lib,
  rustPlatform,
  fetchCrate,
  nix-update-script,
  nodejs_latest,
  pkg-config,
  openssl,
  stdenv,
  curl,
  darwin,
}: let
  pname = "wasm-bindgen-cli";
  version = "0.2.104";
  src = fetchCrate {
    pname = "wasm-bindgen-cli";
    version = version;
    hash = "sha256-9kW+a7IreBcZ3dlUdsXjTKnclVW1C1TocYfY8gUgewE=";
  };
in
  rustPlatform.buildRustPackage {
    inherit pname version;
    inherit src;

    cargoDeps = rustPlatform.fetchCargoVendor {
      inherit src;
      inherit (src) pname version;
      hash = "sha256-V0AV5jkve37a5B/UvJ9B3kwOW72vWblST8Zxs8oDctE=";
    };

    nativeBuildInputs = [pkg-config];

    buildInputs =
      [openssl]
      ++ lib.optionals stdenv.hostPlatform.isDarwin [
        curl
        darwin.apple_sdk.frameworks.Security
      ];

    nativeCheckInputs = [nodejs_latest];

    # tests require it to be ran in the wasm-bindgen monorepo
    doCheck = false;

    passthru.updateScript = nix-update-script {};

    meta = {
      homepage = "https://rustwasm.github.io/docs/wasm-bindgen/";
      license = with lib.licenses; [
        asl20 # or
        mit
      ];
      description = "Facilitating high-level interactions between wasm modules and JavaScript";
      maintainers = with lib.maintainers; [rizary];
      mainProgram = "wasm-bindgen";
    };
  }
