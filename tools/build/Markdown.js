"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = exports.indentMultilineString = exports.isListItemToken = exports.isListToken = exports.isHeadingToken = exports.isTextToken = exports.createListItemToken = exports.createListToken = exports.createTextToken = exports.createHeadingToken = exports.render = exports.lexify = exports.TokenType = void 0;
const marked_1 = __importDefault(require("marked"));
const lodash_1 = require("lodash");
var TokenType;
(function (TokenType) {
    TokenType["HEADING"] = "heading";
    TokenType["LIST"] = "list";
    TokenType["LIST_ITEM"] = "listItem";
    TokenType["PARAGRAPH"] = "paragraph";
    TokenType["TEXT"] = "text";
    TokenType["BLOCKQUOTE"] = "blockquote";
    TokenType["SPACE"] = "space";
    TokenType["CODE"] = "code";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
/**
 * Receives markdown text and returns an array of tokens.
 */
function lexify(text) {
    const tokens = marked_1.default.lexer(text);
    recursivelyFixTokens(tokens);
    return tokens;
}
exports.lexify = lexify;
/**
 * Receives an array of tokens and renders them to markdown.
 */
function render(tokens, renderer = new MarkdownRenderer()) {
    // `marked` module is good enough in terms of lexifying, but its main purpose is to
    // convert markdown to html, so we need to write our own renderer for changelogs.
    return lodash_1.unescape(renderer.render(tokens).trim() + EOL);
}
exports.render = render;
/**
 * Creates heading token with given text and depth.
 */
function createHeadingToken(text, depth = 1) {
    return {
        type: TokenType.HEADING,
        depth,
        text,
        tokens: [createTextToken(text)],
    };
}
exports.createHeadingToken = createHeadingToken;
/**
 * Returns a token from given text.
 */
function createTextToken(text) {
    return {
        type: TokenType.TEXT,
        text,
    };
}
exports.createTextToken = createTextToken;
function createListToken(depth = 1) {
    return {
        type: TokenType.LIST,
        depth,
        items: [],
    };
}
exports.createListToken = createListToken;
function createListItemToken(text, depth = 0) {
    return {
        type: TokenType.LIST_ITEM,
        depth,
        text,
        tokens: [createTextToken(text)],
    };
}
exports.createListItemToken = createListItemToken;
/**
 * Type guard for tokens extending TextToken.
 */
function isTextToken(token) {
    return token.type === TokenType.TEXT;
}
exports.isTextToken = isTextToken;
/**
 * Type guard for HeadingToken type.
 */
function isHeadingToken(token) {
    return token.type === TokenType.HEADING;
}
exports.isHeadingToken = isHeadingToken;
/**
 * Type guard for ListToken type.
 */
function isListToken(token) {
    return token.type === TokenType.LIST;
}
exports.isListToken = isListToken;
/**
 * Type guard for ListItemToken type.
 */
function isListItemToken(token) {
    return token.type === TokenType.LIST_ITEM;
}
exports.isListItemToken = isListItemToken;
/**
 * Indents subsequent lines in given string.
 */
function indentMultilineString(str, depth = 0, indent = '  ') {
    return str.replace(/\n/g, '\n' + indent.repeat(depth));
}
exports.indentMultilineString = indentMultilineString;
/**
 * Fixes given tokens in place. We need to know depth of the list
 */
function recursivelyFixTokens(tokens, listDepth = 0) {
    for (const token of tokens) {
        if (token.type === TokenType.LIST) {
            token.depth = listDepth;
            for (const item of token.items) {
                item.type = TokenType.LIST_ITEM;
                item.depth = listDepth;
                recursivelyFixTokens(item.tokens, listDepth + 1);
            }
        }
    }
}
const EOL = '\n';
class MarkdownRenderer {
    render(tokens) {
        let output = '';
        for (const token of tokens) {
            output += this.renderToken(token, { indent: 0 });
        }
        return output;
    }
    /* helpers */
    renderToken(token, ctx) {
        switch (token.type) {
            case TokenType.HEADING:
                return this.heading(token);
            case TokenType.LIST:
                return this.list(token, ctx);
            case TokenType.LIST_ITEM:
                return this.listItem(token, ctx);
            case TokenType.PARAGRAPH:
                return this.paragraph(token, ctx);
            case TokenType.TEXT:
                return this.text(token, ctx);
            case TokenType.SPACE:
                return this.space(token);
            case TokenType.CODE:
                return this.code(token, ctx);
            case TokenType.BLOCKQUOTE:
                return this.blockquote(token, ctx);
            default:
                // `marked` provides much more tokens, however we don't need to go so deep.
                // So far we needed only tokens with above types.
                throw new Error(`Cannot parse token with type: ${token.type}`);
        }
    }
    indent(depth, indentStr = '  ') {
        return depth ? indentStr.repeat(depth) : '';
    }
    /* tokens */
    heading(token) {
        return this.indent(token.depth, '#') + ' ' + token.text + EOL.repeat(2);
    }
    list(token, ctx) {
        let output = '';
        for (let i = 0; i < token.items.length; i++) {
            output += this.listItem(token.items[i], {
                ...ctx,
                orderedList: token.ordered,
                itemIndex: i + 1,
            });
        }
        return output + EOL;
    }
    listItem(token, ctx) {
        var _a, _b;
        const indent = (_a = ctx.indent) !== null && _a !== void 0 ? _a : 0;
        const bullet = ctx.orderedList ? `${(_b = ctx.itemIndex) !== null && _b !== void 0 ? _b : 1}.` : '-';
        let output = this.indent(indent) + bullet + ' ';
        if (token.tokens[0]) {
            output += this.renderToken(token.tokens[0], ctx).trimRight() + EOL;
        }
        for (const child of token.tokens.slice(1)) {
            output += this.renderToken(child, { ...ctx, indent: indent + 1 }).trimRight() + EOL;
        }
        return output.trimRight() + EOL;
    }
    paragraph(token, ctx) {
        return this.indent(ctx.indent) + token.text + EOL;
    }
    text(token, ctx) {
        // TextToken may have children which we don't really need - they would render to `text` either way.
        return this.indent(ctx.indent) + token.text;
    }
    space(token) {
        // Actually formatting of other tokens is good enough that we don't need to render additional newlines.
        return EOL;
    }
    code(token, ctx) {
        var _a;
        const lines = token.text.split(EOL);
        const indentStr = this.indent(ctx === null || ctx === void 0 ? void 0 : ctx.indent);
        lines.unshift((_a = '```' + token.lang) !== null && _a !== void 0 ? _a : '');
        lines.push('```');
        return indentStr + lines.join(EOL + indentStr);
    }
    blockquote(token, ctx) {
        const indentStr = this.indent(ctx.indent);
        return (indentStr +
            token.tokens
                .map((child) => '> ' + this.renderToken(child, { ...ctx, indent: 0 }).trimRight())
                .join(EOL + indentStr));
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
//# sourceMappingURL=Markdown.js.map