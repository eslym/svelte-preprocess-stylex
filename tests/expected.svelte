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

const __styles = __stylex.create({header$29_19: {
        position: 'stickty',
        top: 0
    },p$41_23: {
            lineHeight: 1.5
        }});
</script>

<script lang="ts">
import * as __stylex from "@stylexjs/stylex";

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

<header
    {...__stylex.attrs(__styles.header$29_19)}
>
    This is header
</header>
<div {...__stylex.attrs(styles.container, containerStyles)}>
    <h1 {...__stylex.attrs(styles.title)}>Hello World!</h1>
    <p
        {...__stylex.attrs(stylex, __styles.p$41_23)}
        
        
    >
        {@render children()}
    </p>
</div>
