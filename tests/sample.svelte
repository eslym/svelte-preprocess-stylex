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

<script lang="ts">
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

<div stylex={[styles.container, containerStyles]}>
    <h1 stylex={styles.title}>Hello World!</h1>
    <p {stylex}>
        {@render children()}
    </p>
    <p {...{ stylex }}>This will not be transformed.</p>
</div>
