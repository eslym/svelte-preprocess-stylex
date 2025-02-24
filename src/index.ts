import { parse, type AST, type PreprocessorGroup } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { Expression, Position } from 'estree';

export interface StylexPreprocessOptions {
    /**
     * The attribute name to transform into `stylex.attrs`.
     *
     * @default 'stylex-attrs'
     */
    attrName?: string;

    /**
     * The shorthand attribute name to transform into `stylex.attrs`.
     */
    shorthandAttrName?: string;

    /**
     * The attribute name to transform into `stylex.create`.
     *
     * @experimental
     * @default 'stylex-create'
     */
    createAttrName?: string;

    /**
     * Where to import stylex.
     *
     * @default '@stylexjs/stylex'
     */
    stylexImport?: string;

    /**
     * The alias name of the stylex to use,
     * different from the default to avoid conflicts.
     *
     * @default '__stylex'
     */
    stylexAs?: string;

    /**
     * The variable name for stylex.create.
     *
     * @experimental
     * @default '__styles'
     */
    createVarName?: string;
}

export function stylexPreprocess(options: StylexPreprocessOptions = {}): PreprocessorGroup {
    const {
        attrName: stylex_attr = 'stylex-attrs',
        createAttrName: stylex_create_attr = 'stylex-create',
        createVarName: stylex_create_var = '__styles',
        stylexImport: stylex_import = '@stylexjs/stylex',
        stylexAs: stylex_alias = '__stylex'
    } = options;
    return {
        name: 'stylex-preprocess',
        markup({ content, filename }) {
            const result = new MagicString(content);
            const ast = parse(content, { filename, modern: true }) as AST.Root;

            const to_transform = new Map<
                AST.ElementLike,
                {
                    attrs?: {
                        attr: AST.Attribute | AST.SpreadAttribute;
                        expr: Expression;
                    };
                    create?: {
                        attr: AST.Attribute;
                        expr: Expression;
                    };
                }
            >();

            function set_attrs(
                node: AST.ElementLike,
                attrs: { attr: AST.Attribute | AST.SpreadAttribute; expr: Expression }
            ) {
                const existing = to_transform.get(node) || {};
                existing.attrs = attrs;
                to_transform.set(node, existing);
            }

            function set_create(
                node: AST.ElementLike,
                create: { attr: AST.Attribute; expr: Expression }
            ) {
                const existing = to_transform.get(node) || {};
                existing.create = create;
                to_transform.set(node, existing);
            }

            for (const el of find_elements(ast)) {
                for (const attr of el.attributes) {
                    if (attr.type === 'Attribute') {
                        const expr_tag = get_expression(attr);
                        if (!expr_tag) continue;
                        switch (attr.name) {
                            case stylex_attr:
                                set_attrs(el, { attr, expr: expr_tag.expression });
                                break;
                            case stylex_create_attr:
                                set_create(el, { attr, expr: expr_tag.expression });
                                break;
                        }
                    } else if (attr.type === 'SpreadAttribute') {
                        if (
                            attr.expression.type !== 'Identifier' ||
                            attr.expression.name !== stylex_attr
                        )
                            continue;
                        set_attrs(el, { attr, expr: attr.expression });
                    }
                }
            }

            if (!to_transform.size) {
                return;
            }

            const creates: string[] = [];

            for (const { attrs, create } of to_transform.values()) {
                let styles_prepend = '';
                if (create) {
                    const expr = create.expr;
                    const src = content.substring(expr.start, expr.end);
                    styles_prepend = `${pos(expr.loc!.start)}${pos(expr.loc!.end)}`;
                    creates.push(`${styles_prepend}: ${src}`);
                    result.remove(create.attr.start, create.attr.end);
                }
                if (attrs) {
                    let [start, end] = [attrs.expr.start, attrs.expr.end];
                    if (attrs.expr.type === 'ArrayExpression') {
                        const elements = attrs.expr.elements.filter(Boolean);
                        if (elements.length === 0) {
                            end = start;
                        } else {
                            start = elements[0]!.start;
                            end = elements[elements.length - 1]!.end;
                        }
                    }
                    let args = content.substring(start, end);
                    if (styles_prepend) {
                        args = [`${stylex_create_var}.${styles_prepend}`, args]
                            .filter(Boolean)
                            .join(', ');
                    }
                    result.update(
                        attrs.attr.start,
                        attrs.attr.end,
                        `{...${stylex_alias}.attrs(${args})}`
                    );
                } else if (create) {
                    result.update(
                        create.attr.start,
                        create.attr.end,
                        `{...${stylex_alias}.attrs(${stylex_create_var}.${styles_prepend})}`
                    );
                }
            }

            if (ast.instance) {
                result.prependLeft(
                    ast.instance.content.start,
                    `\nimport ${stylex_alias} from ${JSON.stringify(stylex_import)};\n`
                );
            } else {
                result.prepend(
                    `<script>import ${stylex_alias} from ${JSON.stringify(stylex_import)};</script>`
                );
            }

            if (creates.length) {
                const create_statement = `\nconst ${stylex_create_var} = ${stylex_alias}.create(${creates.join(',')});\n`;
                if (ast.module) {
                    result.appendRight(ast.module.content.end, create_statement);
                } else {
                    result.prepend(`<script module>${create_statement}</script>`);
                }
            }

            return {
                code: result.toString(),
                map: result.generateMap()
            };
        }
    };
}

type NodeLike = { type: string };
type HTMLElement = AST.RegularElement | AST.SvelteElement;

function* find_elements(node: NodeLike): Generator<HTMLElement> {
    if (is_element(node)) {
        yield node;
    }

    for (const child of children(node)) {
        yield* find_elements(child);
    }
}

function* children(node: NodeLike) {
    for (const val of Object.values(node)) {
        if (!is_node<AST.Fragment>(val, 'Fragment')) continue;
        for (const child of val.nodes) {
            yield child;
        }
    }
}

function is_element(node: NodeLike): node is HTMLElement {
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

function is_node<T extends NodeLike>(
    maybe_node: any,
    type: T['type']
): maybe_node is AST.BaseNode & T {
    return maybe_node?.type === type;
}

function pos(position: Position) {
    return `_${position.line}\$${position.column}`;
}
