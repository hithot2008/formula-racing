import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (message) => {
  throw new Error(message);
};
const shape = (text) => ({
  lists: [...text.matchAll(/^\s*[-*] (?:\[([ x])\] )?/gm)].map((m) => m[1] ?? 'bullet'),
  tables: text
    .split('\n')
    .filter((l) => l.startsWith('|'))
    .map((l) => l.split('|').length - 2),
  commands: [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]),
  numbers: [...text.matchAll(/\d+(?:\.\d+)*/g)].map((m) => m[0]).sort(),
});
export function validatePair(doc) {
  if (!doc.paths?.zh || !doc.paths?.en || doc.paths.zh === doc.paths.en)
    fail('Missing distinct output paths');
  for (const lang of ['zh', 'en']) {
    if (!doc.title?.[lang]?.trim()) fail(`Missing ${lang} title`);
    const path = resolve(root, doc.paths[lang]);
    if (!path.startsWith(root + '/') || !path.endsWith('.md')) fail('Invalid output path');
  }
  if (!Array.isArray(doc.sections) || !doc.sections.length) fail('Missing sections');
  const ids = new Set();
  for (const section of doc.sections) {
    if (!section.id || ids.has(section.id)) fail('Missing or duplicate section ID');
    ids.add(section.id);
    for (const lang of ['zh', 'en'])
      if (typeof section[lang]?.heading !== 'string' || !section[lang]?.body?.trim())
        fail(`${section.id}: missing ${lang} content`);
    if (!!section.zh.heading !== !!section.en.heading) fail(`${section.id}: heading mismatch`);
    const a = shape(section.zh.body),
      b = shape(section.en.body);
    for (const field of Object.keys(a))
      if (JSON.stringify(a[field]) !== JSON.stringify(b[field]))
        fail(
          `${doc.paths.zh}/${section.id}: ${field} mismatch: ${JSON.stringify(a[field])} != ${JSON.stringify(b[field])}`,
        );
  }
}
export function render(doc, lang, source) {
  const other = lang === 'zh' ? 'en' : 'zh',
    link = relative(dirname(doc.paths[lang]), doc.paths[other]);
  const note =
    lang === 'zh'
      ? '此檔由雙語來源產生；請同時修改兩種語言。'
      : 'Generated from paired bilingual sources; update both languages together.';
  return (
    `<!-- ${note} Source: ${source} -->\n\n# ${doc.title[lang]}\n\n[${other === 'en' ? 'English' : '繁體中文'}](${link})\n\n` +
    doc.sections
      .map(
        (s) =>
          `<!-- section: ${s.id} -->\n\n${s[lang].heading ? `## ${s[lang].heading}\n\n` : ''}${s[lang].body.trim()}\n`,
      )
      .join('\n')
  );
}
export function generate(check = false) {
  const outputs = new Map();
  for (const file of readdirSync(resolve(root, 'docs/source'))
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const source = 'docs/source/' + file,
      doc = JSON.parse(readFileSync(resolve(root, source), 'utf8'));
    validatePair(doc);
    for (const lang of ['zh', 'en']) {
      if (outputs.has(doc.paths[lang])) fail('Duplicate output');
      outputs.set(doc.paths[lang], render(doc, lang, source));
    }
  }
  for (const [file, text] of outputs) {
    for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const url = m[1];
      if (/^(?:https?:|#)/.test(url)) continue;
      const target = resolve(root, dirname(file), url.split('#')[0]);
      if (!existsSync(target) && !outputs.has(relative(root, target)))
        fail(`${file}: broken link ${url}`);
    }
    const target = resolve(root, file);
    if (check) {
      if (!existsSync(target) || readFileSync(target, 'utf8') !== text)
        fail(`${file}: stale output; run npm run docs:generate`);
    } else writeFileSync(target, text);
  }
  return outputs.size;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const count = generate(process.argv.includes('--check'));
    console.log(
      `${count} bilingual documents ${process.argv.includes('--check') ? 'verified' : 'generated'}.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
