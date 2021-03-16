"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChangeEntryLabel = exports.loadFrom = exports.Changelog = exports.VERSION_EMPTY_PARAGRAPH_TEXT = exports.UNPUBLISHED_VERSION_NAME = exports.ChangeType = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const semver_regex_1 = __importDefault(require("semver-regex"));
const Markdown = __importStar(require("./Markdown"));
const Utils_1 = require("./Utils");
/**
 * Enum with changelog sections that are commonly used by us.
 */
var ChangeType;
(function (ChangeType) {
    ChangeType["LIBRARY_UPGRADES"] = "\uD83D\uDCDA 3rd party library updates";
    ChangeType["BREAKING_CHANGES"] = "\uD83D\uDEE0 Breaking changes";
    ChangeType["NEW_FEATURES"] = "\uD83C\uDF89 New features";
    ChangeType["BUG_FIXES"] = "\uD83D\uDC1B Bug fixes";
    ChangeType["NOTICES"] = "\u26A0\uFE0F Notices";
})(ChangeType = exports.ChangeType || (exports.ChangeType = {}));
/**
 * Heading name for unpublished changes.
 */
exports.UNPUBLISHED_VERSION_NAME = 'Unpublished';
exports.VERSION_EMPTY_PARAGRAPH_TEXT = '_This version does not introduce any user-facing changes._\n';
/**
 * Depth of headings that mean the version containing following changes.
 */
const VERSION_HEADING_DEPTH = 2;
/**
 * Depth of headings that are being recognized as the type of changes (breaking changes, new features of bugfixes).
 */
const CHANGE_TYPE_HEADING_DEPTH = 3;
/**
 * Depth of the list that can be a group.
 */
const GROUP_LIST_ITEM_DEPTH = 0;
/**
 * Class representing a changelog.
 */
class Changelog {
    constructor(filePath) {
        this.tokens = null;
        this.filePath = filePath;
    }
    /**
     * Resolves to `true` if changelog file exists, `false` otherwise.
     */
    async fileExistsAsync() {
        return await fs_extra_1.default.pathExists(this.filePath);
    }
    /**
     * Lexifies changelog content and returns resulting tokens.
     */
    async getTokensAsync() {
        if (!this.tokens) {
            try {
                const markdown = await fs_extra_1.default.readFile(this.filePath, 'utf8');
                this.tokens = Markdown.lexify(markdown);
            }
            catch (error) {
                this.tokens = [];
            }
        }
        return this.tokens;
    }
    /**
     * Reads versions headers, collects those versions and returns them.
     */
    async getVersionsAsync() {
        const tokens = await this.getTokensAsync();
        return tokens
            .filter((token) => isVersionToken(token))
            .map((token) => parseVersion(token.text))
            .filter(Boolean);
    }
    /**
     * Returns the last version in changelog.
     */
    async getLastPublishedVersionAsync() {
        var _a;
        const versions = await this.getVersionsAsync();
        return (_a = versions.find((version) => semver_1.default.valid(version))) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Reads changes between two given versions and returns them in JS object format.
     * If called without params, then only unpublished changes are returned.
     */
    async getChangesAsync(fromVersion, toVersion = exports.UNPUBLISHED_VERSION_NAME) {
        var _a, _b;
        const tokens = await this.getTokensAsync();
        const versions = {};
        const changes = { totalCount: 0, versions };
        let currentVersion = null;
        let currentSection = null;
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (Markdown.isHeadingToken(token)) {
                if (token.depth === VERSION_HEADING_DEPTH) {
                    const parsedVersion = parseVersion(token.text);
                    if (!parsedVersion) {
                        // Token is not a valid version token.
                        continue;
                    }
                    if (parsedVersion !== toVersion && (!fromVersion || parsedVersion === fromVersion)) {
                        // We've iterated over everything we needed, stop the loop.
                        break;
                    }
                    currentVersion = parsedVersion;
                    currentSection = null;
                    if (!versions[currentVersion]) {
                        versions[currentVersion] = {};
                    }
                }
                else if (currentVersion && token.depth === CHANGE_TYPE_HEADING_DEPTH) {
                    currentSection = token.text;
                    if (!versions[currentVersion][currentSection]) {
                        versions[currentVersion][currentSection] = [];
                    }
                }
                continue;
            }
            if (currentVersion && currentSection && Markdown.isListToken(token)) {
                for (const item of token.items) {
                    const text = (_b = (_a = item.tokens.find(Markdown.isTextToken)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : item.text;
                    changes.totalCount++;
                    versions[currentVersion][currentSection].push(textToChangelogEntry(text));
                }
            }
        }
        return changes;
    }
    /**
     * Saves changes that we made in the array of tokens.
     */
    async saveAsync() {
        // If tokens where not loaded yet, there is nothing to save.
        if (!this.tokens) {
            return;
        }
        // Parse cached tokens and write result to the file.
        await fs_extra_1.default.outputFile(this.filePath, Markdown.render(this.tokens));
        // Reset cached tokens as we just modified the file.
        // We could use an array with new tokens here, but just for safety, let them be reloaded.
        this.tokens = null;
    }
    /**
     * Inserts given entries under specific version, change type and group.
     * Returns a new array of entries that were successfully inserted (filters out duplicated entries).
     * Throws an error if given version cannot be find in changelog.
     */
    async insertEntriesAsync(version, type, group, entries, options = {}) {
        if (entries.length === 0) {
            return [];
        }
        const tokens = await this.getTokensAsync();
        const sectionIndex = tokens.findIndex((token) => isVersionToken(token, version));
        if (sectionIndex === -1) {
            throw new Error(`Version ${version} not found.`);
        }
        for (let i = sectionIndex + 1; i < tokens.length; i++) {
            if (isVersionToken(tokens[i])) {
                // Encountered another version - so given change type isn't in changelog yet.
                // We create appropriate change type token and insert this version token.
                const changeTypeToken = Markdown.createHeadingToken(type, CHANGE_TYPE_HEADING_DEPTH);
                tokens.splice(i, 0, changeTypeToken);
                // `tokens[i]` is now `changeTypeToken` - so we will jump into `if` below.
            }
            if (isChangeTypeToken(tokens[i], type)) {
                const changeTypeToken = tokens[i];
                let list = null;
                let j = i + 1;
                // Find the first list token between headings and save it under `list` variable.
                for (; j < tokens.length; j++) {
                    const item = tokens[j];
                    if (Markdown.isListToken(item)) {
                        list = item;
                        break;
                    }
                    if (Markdown.isHeadingToken(item) && item.depth <= changeTypeToken.depth) {
                        break;
                    }
                }
                // List not found, create new list token and insert it in place where the loop stopped.
                if (!list) {
                    list = Markdown.createListToken();
                    tokens.splice(j, 0, list);
                }
                // If group name is specified, let's go deeper and find (or create) a list for that group.
                if (group) {
                    list = findOrCreateGroupList(list, group);
                }
                const addedEntries = [];
                // Iterate over given entries and push them to the list we ended up with.
                for (const entry of entries) {
                    const entryObject = typeof entry === 'string' ? { message: entry } : entry;
                    const listItemLabel = getChangeEntryLabel(entryObject);
                    // Filter out duplicated entries.
                    if (!list.items.some((item) => item.text.trim() === listItemLabel.trim())) {
                        const listItem = Markdown.createListItemToken(listItemLabel, group ? GROUP_LIST_ITEM_DEPTH : 0);
                        if (options.unshift) {
                            list.items.unshift(listItem);
                        }
                        else {
                            list.items.push(listItem);
                        }
                        addedEntries.push(entryObject);
                    }
                }
                return addedEntries;
            }
        }
        throw new Error(`Cound't find '${type}' section.`);
    }
    /**
     * Renames header of unpublished changes to given version and adds new section with unpublished changes on top.
     */
    async cutOffAsync(version, types = [ChangeType.BREAKING_CHANGES, ChangeType.NEW_FEATURES, ChangeType.BUG_FIXES]) {
        const tokens = await this.getTokensAsync();
        const firstVersionHeadingIndex = tokens.findIndex((token) => isVersionToken(token));
        const newSectionTokens = [
            Markdown.createHeadingToken(exports.UNPUBLISHED_VERSION_NAME, VERSION_HEADING_DEPTH),
            ...types.map((type) => Markdown.createHeadingToken(type, CHANGE_TYPE_HEADING_DEPTH)),
        ];
        if (firstVersionHeadingIndex !== -1) {
            // Set version of the first found version header and put current date in YYYY-MM-DD format.
            const dateStr = new Date().toISOString().substring(0, 10);
            tokens[firstVersionHeadingIndex].text = `${version} — ${dateStr}`;
            // Clean up empty sections.
            let i = firstVersionHeadingIndex + 1;
            while (i < tokens.length && !isVersionToken(tokens[i])) {
                // Remove change type token if its section is empty - when it is followed by another heading token.
                if (isChangeTypeToken(tokens[i])) {
                    const nextToken = tokens[i + 1];
                    if (!nextToken || isChangeTypeToken(nextToken) || isVersionToken(nextToken)) {
                        tokens.splice(i, 1);
                        continue;
                    }
                }
                i++;
            }
            // `i` stayed the same after removing empty change type sections, so the entire version is empty.
            // Let's put an information that this version doesn't contain any user-facing changes.
            if (i === firstVersionHeadingIndex + 1) {
                tokens.splice(i, 0, {
                    type: Markdown.TokenType.PARAGRAPH,
                    text: exports.VERSION_EMPTY_PARAGRAPH_TEXT,
                });
            }
        }
        // Insert new tokens before first version header.
        tokens.splice(firstVersionHeadingIndex, 0, ...newSectionTokens);
    }
    render() {
        if (!this.tokens) {
            throw new Error('Tokens have not been loaded yet!');
        }
        return Markdown.render(this.tokens);
    }
}
exports.Changelog = Changelog;
/**
 * Convenient method creating `Changelog` instance.
 */
function loadFrom(path) {
    return new Changelog(path);
}
exports.loadFrom = loadFrom;
/**
 * Parses given text and returns the first found semver version, or null if none was found.
 * If given text equals to unpublished version name then it's returned.
 */
function parseVersion(text) {
    var _a;
    if (text === exports.UNPUBLISHED_VERSION_NAME) {
        return text;
    }
    const match = semver_regex_1.default().exec(text);
    return (_a = match === null || match === void 0 ? void 0 : match[0]) !== null && _a !== void 0 ? _a : null;
}
/**
 * Parses given text and returns group name if found, null otherwise.
 */
function parseGroup(text) {
    var _a;
    const match = /^\*\*`([@\w\-\/]+)`\*\*/.exec(text.trim());
    return (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : null;
}
/**
 * Checks whether given token is interpreted as a token with a version.
 */
function isVersionToken(token, version) {
    return (Markdown.isHeadingToken(token) &&
        token.depth === VERSION_HEADING_DEPTH &&
        (!version || token.text === version || parseVersion(token.text) === version));
}
/**
 * Checks whether given token is interpreted as a token with a change type.
 */
function isChangeTypeToken(token, changeType) {
    return (Markdown.isHeadingToken(token) &&
        token.depth === CHANGE_TYPE_HEADING_DEPTH &&
        (!changeType || token.text === changeType));
}
/**
 * Checks whether given token is interpreted as a list group.
 */
function isGroupToken(token, groupName) {
    if (Markdown.isListItemToken(token) && token.depth === GROUP_LIST_ITEM_DEPTH) {
        const firstToken = token.tokens[0];
        return Markdown.isTextToken(firstToken) && parseGroup(firstToken.text) === groupName;
    }
    return false;
}
/**
 * Finds list item that makes a group with given name.
 */
function findOrCreateGroupList(list, group) {
    var _a;
    let groupListItem = (_a = list.items.find((item) => isGroupToken(item, group))) !== null && _a !== void 0 ? _a : null;
    // Group list item not found, create new list item token and add it at the end.
    if (!groupListItem) {
        groupListItem = Markdown.createListItemToken(getGroupLabel(group));
        list.items.push(groupListItem);
    }
    // Find group list among list item tokens.
    let groupList = groupListItem.tokens.find(Markdown.isListToken);
    if (!groupList) {
        groupList = Markdown.createListToken(GROUP_LIST_ITEM_DEPTH);
        groupListItem.tokens.push(groupList);
    }
    return groupList;
}
/**
 * Stringifies change entry object.
 */
function getChangeEntryLabel(entry) {
    const pullRequests = entry.pullRequests || [];
    const authors = entry.authors || [];
    if (pullRequests.length + authors.length > 0) {
        const pullRequestsStr = pullRequests
            .map((pullRequest) => `[#${pullRequest}](https://github.com/expo/expo/pull/${pullRequest})`)
            .join(', ');
        const authorsStr = authors
            .map((author) => `[@${author}](https://github.com/${author})`)
            .join(', ');
        const pullRequestInformations = `${pullRequestsStr} by ${authorsStr}`.trim();
        return `${entry.message} (${pullRequestInformations})`;
    }
    return entry.message;
}
exports.getChangeEntryLabel = getChangeEntryLabel;
/**
 * Converts plain group name to its markdown representation.
 */
function getGroupLabel(groupName) {
    return `**\`${groupName}\`**`;
}
function textToChangelogEntry(text) {
    const pullRequests = Utils_1.execAll(/\[#\d+\]\(https?:\/\/github\.com\/expo\/expo\/pull\/(\d+)\)/g, text, 1);
    const authors = Utils_1.execAll(/\[@\w+\]\(https?:\/\/github\.com\/([^/)]+)\)/g, text, 1);
    return {
        message: text.trim(),
        pullRequests: pullRequests.map((match) => parseInt(match, 10)),
        authors,
    };
}
//# sourceMappingURL=Changelogs.js.map