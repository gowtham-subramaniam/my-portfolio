/**
 * Regenerates components/tools/polymer-finder/embeddings.ts after you edit
 * polymers.ts. Not required: edited polymers are re-embedded in the browser
 * automatically. Running this just keeps first searches instant.
 *
 *   npm i -D @huggingface/transformers tsx
 *   npx tsx scripts/embed-polymers.mjs
 *
 * (Adjust FINDER_DIR if your components live under src/.)
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';
import { POLYMERS, polymerDocText } from '../components/tools/polymer-finder/polymers.ts';
import { EMBEDDING_MODEL, EMBEDDING_SCALE } from '../components/tools/polymer-finder/embeddings.ts';
import { fnv1a } from '../components/tools/polymer-finder/search.ts';

const FINDER_DIR = join(dirname(fileURLToPath(import.meta.url)), '../components/tools/polymer-finder');

const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: 'q8' });
const texts = POLYMERS.map(polymerDocText);
const vectors = (await extractor(texts, { pooling: 'mean', normalize: true })).tolist();

const lines = POLYMERS.map((p, i) => {
  const q = Int8Array.from(vectors[i], (x) => Math.max(-127, Math.min(127, Math.round(x * EMBEDDING_SCALE))));
  const b64 = Buffer.from(q.buffer).toString('base64');
  return `  '${p.abbr}': ['${fnv1a(texts[i])}', '${b64}'],`;
});

const header = `/**
 * Precomputed sentence embeddings for each polymer's description text, made
 * with ${EMBEDDING_MODEL} (q8, mean pooling, L2-normalized) and stored as
 * int8 (value × ${EMBEDDING_SCALE}), base64-encoded. With these, the browser only has to
 * embed the visitor's query, so searches are near-instant.
 *
 * Each entry carries an FNV-1a hash of the exact text it was computed from. If
 * you edit a polymer's text in polymers.ts, its hash stops matching and that
 * polymer is re-embedded live in the browser automatically. Run
 * \`npx tsx scripts/embed-polymers.mjs\` to refresh this file.
 *
 * Generated: ${new Date().toISOString().slice(0, 10)}
 */

export const EMBEDDING_MODEL = '${EMBEDDING_MODEL}';
export const EMBEDDING_SCALE = ${EMBEDDING_SCALE};

/** abbr → [fnv1a hash of polymerDocText, base64 int8 vector] */
export const PRECOMPUTED: Record<string, [string, string]> = {
${lines.join('\n')}
};
`;

writeFileSync(join(FINDER_DIR, 'embeddings.ts'), header);
console.log(`Wrote embeddings for ${POLYMERS.length} polymers.`);
