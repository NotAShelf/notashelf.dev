#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Build WASM if it exists
const wasmDir = path.join(rootDir, "packages", "wasm-utils");
if (existsSync(wasmDir)) {
  console.log("Building WASM...");
  const wasmBuild = spawn(
    "wasm-pack",
    [
      "build",
      "--target",
      "web",
      "--out-dir",
      "pkg",
      "--out-name",
      "wasm-utils",
    ],
    {
      cwd: wasmDir,
      stdio: "inherit",
    },
  );

  wasmBuild.on("close", (code) => {
    if (code !== 0) {
      console.warn("⚠️  WASM build failed, continuing without WASM optimizations");
      console.warn("   This may impact performance but won't break the build");
    } else {
      console.log("✅ WASM build completed successfully");
    }

    // Always continue with app build regardless of WASM result
    buildApp();
  });

  wasmBuild.on("error", (err) => {
    console.warn("⚠️  WASM build encountered an error:", err.message);
    console.warn("   Continuing without WASM optimizations");
    buildApp();
  });
} else {
  console.log("No WASM package found, skipping WASM build");
  buildApp();
}

function buildApp() {
  console.log("Building app...");
  const child = spawn(
    "pnpm",
    ["--filter", "./apps/notashelf.dev", "run", "build"],
    {
      cwd: rootDir,
      stdio: "inherit",
    },
  );

  child.on("close", (code) => {
    process.exit(code);
  });
}
