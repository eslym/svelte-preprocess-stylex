import type { StyleXAttr, UserAuthoredStyles } from './runtime';

declare module 'svelte/elements' {
    export interface HTMLAttributes<T> {
        'stylex-attrs'?: StyleXAttr;
        'stylex-create'?: UserAuthoredStyles; // if you need
        'stylex-create-at'?: number; // if you need
    }

    export interface SVGAttributes<T> {
        'stylex-attrs'?: StyleXAttr;
        'stylex-create'?: UserAuthoredStyles; // if you need
        'stylex-create-at'?: number; // if you need
    }
}

export {};
