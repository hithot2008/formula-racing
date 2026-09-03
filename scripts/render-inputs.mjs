import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const digest = (data) => createHash('sha256').update(data).digest('hex');
export function renderInputs() {
  return Object.fromEntries(
    [
      ...readdirSync('src').map((n) => 'src/' + n),
      'index.html',
      'package.json',
      'package-lock.json',
      'vite.config.js',
      'scripts/render-images.mjs',
      'scripts/render-inputs.mjs',
    ]
      .sort()
      .map((file) => [file, digest(readFileSync(file))]),
  );
}
