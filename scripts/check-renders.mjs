import { readFileSync } from 'node:fs';
import { digest, renderInputs } from './render-inputs.mjs';
try {
  const manifest = JSON.parse(readFileSync('artifacts/render-manifest.json', 'utf8'));
  if (JSON.stringify(manifest.inputs) !== JSON.stringify(renderInputs()))
    throw new Error('Rendering inputs changed; run npm run render:images before committing.');
  for (const [file, hash] of Object.entries(manifest.images))
    if (digest(readFileSync(file)) !== hash)
      throw new Error(`${file} differs from the verified render set.`);
  console.log(
    `${Object.keys(manifest.images).length} screenshots match the current rendering inputs.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
