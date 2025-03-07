import { stylexPreprocess } from '../src';
import { preprocess } from 'svelte/compiler';
import { resolve } from 'path';

const preprocessor = stylexPreprocess();

const filename = resolve(import.meta.dir, 'sample.svelte');
const sample = await Bun.file(filename).text();
const result = await preprocess(sample, preprocessor, { filename });

await Bun.write('tests/expected.svelte', result.code);
