import { props as stylex_props, type create as stylex_create } from '@stylexjs/stylex';
import type { ClassValue } from 'svelte/elements';

export type StyleXAttr = typeof stylex_props extends (
    this: any,
    arg: infer U,
    ...args: any[]
) => any
    ? U
    : never;

export type UserAuthoredStyles = Exclude<Parameters<typeof stylex_create>[0][string], () => any>;

export function propsToAttrs(props: ReturnType<typeof stylex_props>) {
    const attrs: { class?: ClassValue; style?: string; 'data-style-src'?: string } = {};
    if (props.className) attrs.class = props.className;
    if (props.style)
        attrs.style = Object.entries(props.style)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
    if (props['data-style-src']) attrs['data-style-src'] = props['data-style-src'];
    return attrs;
}

export function attrs(...styles: StyleXAttr[]) {
    return propsToAttrs(stylex_props(...styles));
}
