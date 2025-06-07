#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Build WASM if it exists
const wasmDir = path.join(rootDir, 'packages', 'wasm-utils');
if (existsSync(wasmDir)) {
  console.log('Building WASM...');
  spawn('wasm-pack', ['build', '--target', 'web', '--out-dir', 'pkg', '--out-name', 'wasm-utils', '--dev'], {
    cwd: wasmDir,
    stdio: 'inherit'
  });
}

// Start dev server
const child = spawn('pnpm', ['--filter', './apps/notashelf.dev', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  child.kill();
  process.exit(0);
});
