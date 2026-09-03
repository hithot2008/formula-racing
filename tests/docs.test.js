import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, validatePair } from '../scripts/docs.mjs';
test('paired documentation is complete and generated files are synchronized', () =>
  assert.equal(generate(true), 10));
test('documentation checks reject missing translations and unequal details', () => {
  const sample = () => ({
    paths: { zh: 'example.md', en: 'example.en.md' },
    title: { zh: '範例', en: 'Example' },
    sections: [
      {
        id: 'details',
        zh: { heading: '功能', body: '- 6 首歌曲\n- 3 種難度' },
        en: { heading: 'Features', body: '- 6 tracks\n- 3 difficulties' },
      },
    ],
  });
  validatePair(sample());
  const missing = sample();
  delete missing.sections[0].en;
  assert.throws(() => validatePair(missing), /missing en/);
  const fewer = sample();
  fewer.sections[0].en.body = '- 6 tracks';
  assert.throws(() => validatePair(fewer), /mismatch/);
  const number = sample();
  number.sections[0].en.body = '- 5 tracks\n- 3 difficulties';
  assert.throws(() => validatePair(number), /numbers mismatch/);
  const command = sample();
  command.sections[0].zh.body += '\n```sh\nnpm test\n```';
  command.sections[0].en.body += '\n```sh\nnpm run build\n```';
  assert.throws(() => validatePair(command), /commands mismatch/);
});
