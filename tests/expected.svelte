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
import { propsToAttrs as __attrs } from "@eslym/svelte-preprocess-stylex/runtime";

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
    {...__attrs(__stylex.props(__styles.header$29_19))}
>
    This is header
</header>
<div {...__attrs(__stylex.props(styles.container, containerStyles))}>
    <h1 {...__attrs(__stylex.props(styles.title))}>Hello World!</h1>
    <p
        {...__attrs(__stylex.props(stylex, __styles.p$41_23))}
        
        
    >
        {@render children()}
    </p>
</div>
