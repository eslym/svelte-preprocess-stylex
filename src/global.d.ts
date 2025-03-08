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
        'stylex-attrs'?: StyleXAttr | readonly StyleXAttr[];
        'stylex-create'?: UserAuthoredStyles; // if you need
        'stylex-create-at'?: number; // if you need
    }

    export interface SVGAttributes<T> {
        'stylex-attrs'?: StyleXAttr | readonly StyleXAttr[];
        'stylex-create'?: UserAuthoredStyles; // if you need
        'stylex-create-at'?: number; // if you need
    }
}

export {};
