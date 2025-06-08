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
  console.log("Building WASM for development...");
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
      "--dev",
    ],
    {
      cwd: wasmDir,
      stdio: "inherit",
    },
  );

  wasmBuild.on("close", (code) => {
    if (code !== 0) {
      console.warn(
        "⚠️  WASM build failed, continuing without WASM optimizations",
      );
      console.warn(
        "   Development server will start but may lack some features",
      );
    } else {
      console.log("✅ WASM build completed successfully");
    }

    // Start dev server regardless of WASM build result
    startDevServer();
  });

  wasmBuild.on("error", (err) => {
    console.warn("⚠️  WASM build encountered an error:", err.message);
    console.warn("   Starting development server without WASM optimizations");
    startDevServer();
  });
} else {
  console.log("No WASM package found, starting dev server");
  startDevServer();
}

function startDevServer() {
  console.log("Starting development server...");
  const child = spawn(
    "pnpm",
    ["--filter", "./apps/notashelf.dev", "run", "dev"],
    {
      cwd: rootDir,
      stdio: "inherit",
    },
  );

  process.on("SIGINT", () => {
    child.kill();
    process.exit(0);
  });
}
