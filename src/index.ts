import { parse, type AST, type PreprocessorGroup } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { ArrayExpression } from 'estree';

export interface StylexPreprocessOptions {
    /**
     * The attribute name to transform into stylex attrs.
     *
     * @default 'stylex'
     */
    attrName?: string;

    /**
     * Where to import stylex.
     *
     * @default '@stylexjs/stylex'
     */
    stylexImport?: string;

    /**
     * The alias name of the attrs function to use,
     * different from the default to avoid conflicts.
     *
     * @default '_stylex_attrs'
     */
    attrsFnName?: string;
}

export function stylexPreprocess({
    attrName: stylex_attr = 'stylex',
    stylexImport: stylex_import = '@stylexjs/stylex',
    attrsFnName: stylex_attrs_fn = '_stylex_attrs'
}: StylexPreprocessOptions = {}): PreprocessorGroup {
    return {
        name: 'stylex-preprocess',
        markup({ content, filename }) {
            const result = new MagicString(content);
            const ast = parse(content, { filename, modern: true }) as AST.Root;

            for (const el of find_elements(ast)) {
                for (const attr of el.attributes) {
                    if (attr.type === 'Attribute') {
                        if (attr.name !== stylex_attr) continue;
                        const expr_tag = get_expression(attr);
                        if (!expr_tag) continue;
                        const expr = expr_tag.expression as AST.BaseNode;
                        let [expr_start, expr_end] = [expr.start, expr.end];
                        if (expr.type === 'ArrayExpression') {
                            const arr_expr = expr as AST.BaseNode & ArrayExpression;
                            const elements = arr_expr.elements.filter(Boolean);
                            if (elements.length) {
                                const first = elements[0] as AST.BaseNode;
                                const last = elements[elements.length - 1] as AST.BaseNode;
                                [expr_start, expr_end] = [first.start, last.end];
                            }
                        }
                        result.update(attr.start, expr_start, `{...${stylex_attrs_fn}(`);
                        result.update(expr_end, attr.end, ')}');
                        continue;
                    }
                    if (attr.type === 'SpreadAttribute') {
                        if (
                            attr.expression.type !== 'Identifier' ||
                            attr.expression.name !== stylex_attr
                        )
                            continue;
                        result.update(
                            attr.start,
                            attr.end,
                            `{...${stylex_attrs_fn}(${stylex_attr})}`
                        );
                    }
                }
            }

            if (!result.hasChanged()) {
                return;
            }

            if (ast.instance) {
                result.appendLeft(
                    (ast.instance.content as any).start,
                    `import { attrs as ${stylex_attrs_fn} } from ${JSON.stringify(stylex_import)};\n`
                );
            } else {
                result.prepend(
                    `<script>import { attrs as ${stylex_attrs_fn} } from ${JSON.stringify(stylex_import)};</script>`
                );
            }

            return {
                code: result.toString(),
                map: result.generateMap()
            };
        }
    };
}

function* find_elements(node: AST.BaseNode): Generator<AST.RegularElement | AST.SvelteElement> {
    if (is_element(node)) {
        yield node;
    }

    for (const child of children(node)) {
        yield* find_elements(child);
    }
}

function* children(node: AST.BaseNode) {
    for (const val of Object.values(node)) {
        if (!is_fragment(val)) continue;
        for (const child of val.nodes) {
            yield child;
        }
    }
}

function is_fragment(maybe_fragment: any): maybe_fragment is AST.Fragment {
    return (
        maybe_fragment && typeof maybe_fragment === 'object' && maybe_fragment.type === 'Fragment'
    );
}

function is_element(node: AST.BaseNode): node is AST.RegularElement | AST.SvelteElement {
    return node.type === 'RegularElement' || node.type === 'SvelteElement';
}

function get_expression(node: AST.Attribute): AST.ExpressionTag | null {
    if (node.value === true) {
        return null;
    }
    if (Array.isArray(node.value)) {
        if (node.value.length !== 1) {
            return null;
        }
        if (node.value[0].type !== 'ExpressionTag') {
            return null;
        }
        return node.value[0];
    }
    return node.value;
}
