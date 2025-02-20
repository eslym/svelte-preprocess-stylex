<script lang="ts" module>
    const styles = create({
        container: {
            maxWidth: '1200px',
            margin: '0 auto'
        },
        title: {
            fontSize: '2rem'
        }
    });
</script>

<script lang="ts">import { attrs as _stylex_attrs } from "@stylexjs/stylex";

    import type { Snippet } from 'svelte';
    import { create, type StyleXStyles } from '@stylexjs/stylex';

    let {
        containerStyles = undefined,
        stylex = undefined,
        children
    }: {
        containerStyles?: StyleXStyles;
        stylex?: StyleXStyles;
        children: Snippet;
    } = $props();
</script>

<div {..._stylex_attrs(styles.container, containerStyles)}>
    <h1 {..._stylex_attrs(styles.title)}>Hello World!</h1>
    <p {..._stylex_attrs(stylex)}>
        {@render children()}
    </p>
    <p {...{ stylex }}>This will not be transformed.</p>
</div>
