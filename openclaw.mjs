#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the CLI/runtime entry point.
//
// `dist/entry.mjs` is the executable CLI bootstrap. Falling back to `dist/index.mjs`
// keeps compatibility with older builds that only shipped index.
try {
  await import(resolve(__dirname, 'dist/entry.mjs'));
} catch {
  await import(resolve(__dirname, 'dist/index.mjs'));
}
