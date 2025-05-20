import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const dtsPlugin = dts();

export default [
    {
        input: './src/index.ts',
        output: [
            {
                file: 'dist/index.cjs',
                format: 'cjs',
                sourcemap: true
            },
            {
                file: 'dist/index.mjs',
                format: 'es',
                sourcemap: true
            }
        ],
        external: ['svelte/compiler', 'magic-string', '@eslym/svelte-preprocess-stylex/runtime'],
        plugins: [resolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })]
    },
    {
        input: 'src/index.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        external: ['svelte/compiler', 'magic-string', '@eslym/svelte-preprocess-stylex/runtime'],
        plugins: [
            {
                ...dtsPlugin,
                outputOptions(...args) {
                    const opts = dtsPlugin.outputOptions(...args);
                    opts.interop = 'esModule';
                    delete opts.namespaceToStringTag;
                    opts.generatedCode = { symbols: false, ...opts.generatedCode };
                    return opts;
                }
            }
        ]
    },
    {
        input: './src/runtime.ts',
        output: [
            {
                file: 'dist/runtime.cjs',
                format: 'cjs',
                sourcemap: true
            },
            {
                file: 'dist/runtime.mjs',
                format: 'es',
                sourcemap: true
            }
        ],
        external: ['@stylexjs/stylex', 'svelte/elements'],
        plugins: [resolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })]
    },
    {
        input: 'src/runtime.ts',
        output: [{ file: 'dist/runtime.d.ts', format: 'es' }],
        external: ['@stylexjs/stylex', 'svelte/elements'],
        plugins: [
            {
                ...dtsPlugin,
                outputOptions(...args) {
                    const opts = dtsPlugin.outputOptions(...args);
                    opts.interop = 'esModule';
                    delete opts.namespaceToStringTag;
                    opts.generatedCode = { symbols: false, ...opts.generatedCode };
                    return opts;
                }
            }
        ]
    }
];
