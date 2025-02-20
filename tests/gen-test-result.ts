import { stylexPreprocess } from '../src';
import { preprocess } from 'svelte/compiler';

const preprocessor = stylexPreprocess();

const sample = await Bun.file('tests/sample.svelte').text();
const result = await preprocess(sample, preprocessor);

await Bun.write('tests/expected.svelte', result.code);
