import { expect, test } from 'bun:test';
import { stylexPreprocess } from '../src';
import { preprocess } from 'svelte/compiler';

test('preprocess', async () => {
    const preprocessor = stylexPreprocess();

    const sample = await Bun.file(`${import.meta.dirname}/sample.svelte`).text();
    const expected = await Bun.file(`${import.meta.dirname}/expected.svelte`).text();
    const result = await preprocess(sample, preprocessor);

    expect(result.code).toBe(expected);
});
