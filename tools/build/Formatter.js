"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatXcodeBuildOutput = exports.stripNonAsciiChars = exports.formatFileLog = exports.formatChangelogEntry = exports.formatCommitHash = exports.formatCommitTitle = exports.formatCommitLog = exports.link = void 0;
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const terminal_link_1 = __importDefault(require("terminal-link"));
const { white, cyan, red, green, yellow, blue, gray, dim, reset } = chalk_1.default;
/**
 * Uses `terminal-link` to create clickable link in the terminal.
 * If the terminal doesn't support this feature, fallback just to provided text, it would look ugly on the CI.
 */
function link(text, url) {
    return terminal_link_1.default(text, url, { fallback: (text) => text });
}
exports.link = link;
/**
 * Formats an entry from git log.
 */
function formatCommitLog(log) {
    const authorName = green(log.authorName);
    const commitHash = formatCommitHash(log.hash);
    const title = formatCommitTitle(log.title);
    const date = log.committerRelativeDate;
    return `${commitHash} ${title} ${gray(`by ${authorName} ${date}`)}`;
}
exports.formatCommitLog = formatCommitLog;
/**
 * Formats commit title. So far it only makes closing PR number a link to the PR on GitHub.
 */
function formatCommitTitle(title) {
    return title.replace(/\(#(\d+)\)$/g, `(${blue.bold(link('#$1', 'https://github.com/expo/expo/pull/$1'))})`);
}
exports.formatCommitTitle = formatCommitTitle;
/**
 * Formats commit hash to display it as a link pointing to the commit on GitHub.
 */
function formatCommitHash(hash) {
    if (!hash) {
        return gray('undefined');
    }
    const url = `https://github.com/expo/expo/commit/${hash}`;
    const abbreviatedHash = hash.substring(0, 6);
    return yellow.bold(`(${link(abbreviatedHash, url)})`);
}
exports.formatCommitHash = formatCommitHash;
/**
 * Formats markdown changelog entry to be displayed nicely in the terminal.
 * Replaces links to terminal chars sequence that prints clickable text pointing to given URL.
 */
function formatChangelogEntry(entry) {
    return entry
        .replace(/\[(#\d+|@\w+)\]\(([^)]+?)\)/g, blue.bold(link('$1', '$2')))
        .replace(/(\W)([_*]{2})([^\2]*?)\2(\W)/g, '$1' + reset.bold('$3') + '$4')
        .replace(/(\W)([_*])([^\2]*?)\2(\W)/g, '$1' + reset.italic('$3') + '$4')
        .replace(/`([^`]+?)`/g, dim('$1'));
}
exports.formatChangelogEntry = formatChangelogEntry;
/**
 * Formats file log - that is a relative file path and the status (modified, added, etc.).
 */
function formatFileLog(fileLog) {
    const uri = `vscode://file/${fileLog.path}`;
    return `${link(fileLog.relativePath, uri)} ${gray(`(${fileLog.status})`)}`;
}
exports.formatFileLog = formatFileLog;
/**
 * Removes all non-ascii characters (characters with unicode number between `0` and `127` are left untouched) from the string.
 * https://www.utf8-chartable.de/unicode-utf8-table.pl?number=128
 */
function stripNonAsciiChars(str) {
    return str.replace(/[^\x00-\x7F]/gu, '');
}
exports.stripNonAsciiChars = stripNonAsciiChars;
/**
 * Makes Xcode logs pretty as xcpretty :)
 */
function formatXcodeBuildOutput(output) {
    return output
        .replace(/^(\/.*)(:\d+:\d+): (error|warning|note)(:.*)$/gm, (_, p1, p2, p3, p4) => {
        if (p3 === 'note') {
            return gray.bold(p3) + white.bold(p4);
        }
        const relativePath = path_1.default.relative(process.cwd(), p1);
        const logColor = p3 === 'error' ? red.bold : yellow.bold;
        return cyan.bold(relativePath + p2) + ' ' + logColor(p3 + p4);
    })
        .replace(/^(In file included from )(\/[^\n]+)(:\d+:[^\n]*)$/gm, (_, p1, p2, p3) => {
        const relativePath = path_1.default.relative(process.cwd(), p2);
        return gray.italic(p1 + relativePath + p3);
    })
        .replace(/\s\^\n(\s[^\n]+)?/g, green.bold('$&\n'))
        .replace(/\*\* BUILD FAILED \*\*/, red.bold('$&'));
}
exports.formatXcodeBuildOutput = formatXcodeBuildOutput;
//# sourceMappingURL=Formatter.js.map