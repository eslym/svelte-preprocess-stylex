<script lang="ts" module>const __styles = __stylex.create(_32$23_34$9: {
            lineHeight: 1.5
        });

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

<script lang="ts">import __stylex from "@stylexjs/stylex";

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

<div {...__stylex.attrs(styles.container, containerStyles)}>
    <h1 {...__stylex.attrs(styles.title)}>Hello World!</h1>
    <p
        {...__stylex.attrs(__styles._32$23_34$9, stylex)}
        
    >
        {@render children()}
    </p>
</div>
