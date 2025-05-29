import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "./apps/notashelf.dev",
  "./packages/astro-email-obfuscation",
  "./packages/astro-purge-css", 
  "./packages/remark-em-dash",
  "./packages/vite-copyright-replace",
]);
