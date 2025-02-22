# @eslym/svelte-preprocess-stylex

A svelte preprocessor to make [stylex](https://github.com/facebook/stylex) more readable in svelte.

## Install

```bash
npm install -D @eslym/svelte-preprocess-stylex
```

```bash
yarn add -D @eslym/svelte-preprocess-stylex
```

```bash
pnpm add -D @eslym/svelte-preprocess-stylex
```

```bash
bun add -d @eslym/svelte-preprocess-stylex
```

## Usage

```js
// svelte.config.js
import { stylexPreprocess } from '@eslym/svelte-preprocess-stylex';

export default {
    preprocess: [
        stylexPreprocess()
        /* other preprocessors */
    ]
};
```

After using this preprocessor, you can use `stylex` attribute (html elements only) for stylex styles.

```svelte
<div stylex-attrs={[styles.container, margin.xAuto]}>
    <div stylex-attrs={styles.content}>...</div>
</div>
```

will be transformed into

```svelte
<div {...attrs(styles.container, margin.xAuto)}>
    <div {...attrs(styles.content)}>...</div>
</div>
```

> [!NOTE]
> The order of attributes will stay at where it is.
>
> ```svelte
> <a href="#" stylex-attrs={[styles.container, margin.xAuto]} title="example">...</div>
> ```
>
> will be transformed into
>
> ```svelte
> <a href="#" {...attrs(styles.container, margin.xAuto)} title="example">...</div>
> ```

### Don't

Spread attribute is not supported.

```svelte
<script lang="ts">
    import type { StyleXStyles } from '@stylexjs/stylex';

    let {
        attrs = {}
    }: {
        attrs?: {
            ['stylex-attrs']?: StyleXStyles;
        };
    } = $props();
</script>

<!-- this will not work, preprocessor doesn't know what is in the object -->
<div {...attrs}>...</div>
```

### Do

Extract the value from object and pass it to the element.

```svelte
<script lang="ts">
    import type { StyleXStyles } from '@stylexjs/stylex';

    let {
        attrs = {}
    }: {
        attrs?: {
            ['stylex-attrs']?: StyleXStyles;
        };
    } = $props();

    let stylex = $derived(attrs['stylex-attrs']);
</script>

<div stylex-attrs={stylex}>...</div>
```

## Experimental Feature

There is an experimental `stylex-create` attribute to inline the creation of stylex styles.

```svelte
<div stylex-create={{ color: 'red' }} stylex-attrs={someStyles}>...</div>
```

will be transformed into

```svelte
<script module>
    const __styles = stylex.create({
        a_generated_key: { color: 'red' }
    });
</script>

<!-- the inline create is always the base style, the original order does not matter -->
<div {...attrs(someStyles, __styles.a_generated_key)}>...</div>
```

The stability of this feature is not guaranteed, so use at your own risk.

## Typesafety

Add the following code into any ambient `.d.ts` file to enable typesafety. (ex: `src/app.d.ts` for sveltekit)

```ts
import type {
    CompiledStyles,
    StyleXArray,
    InlineStyles,
    UserAuthoredStyles
} from '@stylexjs/stylex/lib/StyleXTypes';

declare global {
    type StyleXAttr = StyleXArray<
        (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
    >;
}

declare module 'svelte/elements' {
    export interface HTMLAttributes<T> {
        ['stylex-attrs']?: StyleXAttr | readonly StyleXAttr[];
        ['stylex-create']?: UserAuthoredStyles; // if you need
    }

    export interface SVGAttributes<T> {
        ['stylex-attrs']?: StyleXAttr | readonly StyleXAttr[];
        ['stylex-create']?: UserAuthoredStyles; // if you need
    }
}

export {};
```
