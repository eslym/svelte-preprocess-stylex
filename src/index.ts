import { parse, type AST, type PreprocessorGroup } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { Expression, SpreadElement } from 'estree';

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
     * The attribute name to transform into `stylex.create` at the specified position in stylex.attrs.
     *
     * @experimental
     * @default 'stylex-create-at'
     */
    createAtAttrName?: string;

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
        createAtAttrName: stylex_create_at_attr = 'stylex-create-at',
        createVarName: stylex_create_var = '__styles',
        stylexImport: stylex_import = '@stylexjs/stylex',
        stylexAs: stylex_alias = '__stylex'
    } = options;
    let warn_stylex_create = true;
    let warn_stylex_create_at = true;
    return {
        name: 'stylex-preprocess',
        markup({ content, filename }) {
            if (!content.includes(stylex_attr) && !content.includes(stylex_create_attr)) {
                return;
            }

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
                        el: HTMLElement;
                        attr: AST.Attribute;
                        expr: Expression;
                    };
                    at?: number;
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
                create: { el: HTMLElement; attr: AST.Attribute; expr: Expression }
            ) {
                const existing = to_transform.get(node) || {};
                existing.create = create;
                to_transform.set(node, existing);
            }

            function set_at(node: AST.ElementLike, at: number) {
                const existing = to_transform.get(node) || {};
                existing.at = at;
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
                                if (warn_stylex_create) {
                                    warn_at(
                                        `'${stylex_create_attr}' attribute is experimental and subject to change.`,
                                        filename,
                                        get_location(content, attr.start)
                                    );
                                    warn_stylex_create = false;
                                }
                                set_create(el, { el, attr, expr: expr_tag.expression });
                                break;
                            case stylex_create_at_attr:
                                if (warn_stylex_create_at) {
                                    warn_at(
                                        `'${stylex_create_at_attr}' attribute is experimental and subject to change.`,
                                        filename,
                                        get_location(content, attr.start)
                                    );
                                    warn_stylex_create_at = false;
                                }
                                result.update(attr.start, attr.end, '');
                                if (
                                    expr_tag.expression.type === 'Identifier' &&
                                    expr_tag.expression.name === 'Infinity'
                                ) {
                                    set_at(el, Infinity);
                                    continue;
                                }
                                if (expr_tag.expression.type !== 'Literal') {
                                    continue;
                                }
                                const at = expr_tag.expression.value;
                                if (typeof at !== 'number') {
                                    continue;
                                }
                                set_at(el, at);
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

            for (const { attrs, create, at = 0 } of to_transform.values()) {
                let styles_insert = '';
                if (create) {
                    const expr = create.expr;
                    const src = content.substring(expr.start, expr.end);
                    styles_insert = style_name(create.el, expr);
                    creates.push(`${styles_insert}: ${src}`);
                    result.remove(create.attr.start, create.attr.end);
                }
                if (attrs) {
                    const args_elements = wrap_array(attrs.expr);
                    const args = [];
                    for (const arg of args_elements) {
                        const code = content.substring(arg.start, arg.end);
                        args.push(code);
                    }
                    if (styles_insert) {
                        args.splice(at, 0, `${stylex_create_var}.${styles_insert}`);
                    }
                    result.update(
                        attrs.attr.start,
                        attrs.attr.end,
                        `{...${stylex_alias}.attrs(${args.join(', ')})}`
                    );
                } else if (create) {
                    result.update(
                        create.attr.start,
                        create.attr.end,
                        `{...${stylex_alias}.attrs(${stylex_create_var}.${styles_insert})}`
                    );
                }
            }

            if (ast.instance) {
                result.prependLeft(
                    ast.instance.content.start,
                    `\nimport * as ${stylex_alias} from ${JSON.stringify(stylex_import)};\n`
                );
            } else {
                result.prepend(
                    `<script>import * as ${stylex_alias} from ${JSON.stringify(stylex_import)};</script>`
                );
            }

            if (creates.length) {
                const create_statement = `\nconst ${stylex_create_var} = ${stylex_alias}.create({${creates.join(',')}});\n`;
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

function style_name(element: HTMLElement, expr: Expression) {
    const el = element.type === 'RegularElement' ? element.name : 'el';
    const pos = expr.loc!.start;
    return `${el}\$${pos.line}_${pos.column}`;
}

function wrap_array(expr: Expression): (Expression | SpreadElement)[] {
    if (expr.type === 'ArrayExpression') {
        return expr.elements.filter(Boolean) as any;
    }
    return [expr];
}

function warn_at(
    message: string,
    filename: string | undefined,
    { line, column }: { line: number; column: number }
) {
    console.warn(`${message} \n\tat ${filename ?? '<anonymous>'}:${line}:${column}`);
}

function get_location(src: string, start: number) {
    const lines = src
        .slice(0, start)
        .replace(/\r?\n|\n?\r/g, '\n')
        .split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
}
