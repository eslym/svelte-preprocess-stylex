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

const __styles = __stylex.create({header$28_23: {
    position: 'stickty',
    top: 0,
},p$38_23: {
            lineHeight: 1.5
        }});
</script>

<script lang="ts">
import __stylex from "@stylexjs/stylex";

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

<header {...__stylex.attrs(__styles.header$28_23)}>
    This is header
</header>
<div {...__stylex.attrs(styles.container, containerStyles)}>
    <h1 {...__stylex.attrs(styles.title)}>Hello World!</h1>
    <p
        {...__stylex.attrs(__styles.p$38_23, stylex)}
        
    >
        {@render children()}
    </p>
</div>
