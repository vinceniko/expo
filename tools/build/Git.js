"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitDirectory = exports.GitFileStatus = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Utils_1 = require("./Utils");
const Constants_1 = require("./Constants");
var GitFileStatus;
(function (GitFileStatus) {
    GitFileStatus["M"] = "modified";
    GitFileStatus["C"] = "copy";
    GitFileStatus["R"] = "rename";
    GitFileStatus["A"] = "added";
    GitFileStatus["D"] = "deleted";
    GitFileStatus["U"] = "unmerged";
})(GitFileStatus = exports.GitFileStatus || (exports.GitFileStatus = {}));
/**
 * Helper class that stores the directory inside the repository so we don't have to pass it many times.
 * This directory path doesn't have to be the repo's root path,
 * it's just like current working directory for all other commands.
 */
class GitDirectory {
    constructor(path) {
        this.path = path;
        this.Directory = GitDirectory;
    }
    /**
     * Generic command used by other methods. Spawns `git` process at instance's repository path.
     */
    async runAsync(args, options = {}) {
        return Utils_1.spawnAsync('git', args, {
            cwd: this.path,
            ...options,
        });
    }
    /**
     * Same as `runAsync` but returns boolean value whether the process succeeded or not.
     */
    async tryAsync(args, options = {}) {
        try {
            await this.runAsync(args, options);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Initializes git repository in the directory.
     */
    async initAsync() {
        const dotGitPath = path_1.default.join(this.path, '.git');
        if (!(await fs_extra_1.default.pathExists(dotGitPath))) {
            await this.runAsync(['init']);
        }
    }
    /**
     * Adds a new remote to the local repository.
     */
    async addRemoteAsync(name, url) {
        await this.runAsync(['remote', 'add', name, url]);
    }
    /**
     * Switches to given commit reference.
     */
    async checkoutAsync(ref) {
        await this.runAsync(['checkout', ref]);
    }
    /**
     * Returns repository's branch name that you're checked out on.
     */
    async getCurrentBranchNameAsync() {
        const { stdout } = await this.runAsync(['rev-parse', '--abbrev-ref', 'HEAD']);
        return stdout.replace(/\n+$/, '');
    }
    /**
     * Returns name of remote branch that the current local branch is tracking.
     */
    async getTrackingBranchNameAsync() {
        const { stdout } = await this.runAsync([
            'rev-parse',
            '--abbrev-ref',
            '--symbolic-full-name',
            '@{u}',
        ]);
        return stdout.trim();
    }
    /**
     * Tries to deduce the SDK version from branch name. Returns null if the branch name is not a release branch.
     */
    async getSDKVersionFromBranchNameAsync() {
        const currentBranch = await this.getCurrentBranchNameAsync();
        const match = currentBranch.match(/\bsdk-(\d+)$/);
        if (match) {
            const sdkMajorNumber = match[1];
            return `${sdkMajorNumber}.0.0`;
        }
        return null;
    }
    /**
     * Returns full head commit hash.
     */
    async getHeadCommitHashAsync() {
        const { stdout } = await this.runAsync(['rev-parse', 'HEAD']);
        return stdout.trim();
    }
    /**
     * Fetches updates from remote repository.
     */
    async fetchAsync(options = {}) {
        const args = ['fetch'];
        if (options.depth) {
            args.push('--depth', options.depth.toString());
        }
        if (options.remote) {
            args.push(options.remote);
        }
        if (options.ref) {
            args.push(options.ref);
        }
        await this.runAsync(args);
    }
    /**
     * Pulls changes from the tracking remote branch.
     */
    async pullAsync(options) {
        const args = ['pull'];
        if (options.rebase) {
            args.push('--rebase');
        }
        await this.runAsync(args);
    }
    /**
     * Pushes new commits to the tracking remote branch.
     */
    async pushAsync(options) {
        const args = ['push'];
        if (options.track) {
            args.push('--set-upstream', 'origin', options.track);
        }
        await this.runAsync(args);
    }
    /**
     * Returns formatted results of `git log` command.
     */
    async logAsync(options = {}) {
        var _a, _b, _c;
        const fromCommit = (_a = options.fromCommit) !== null && _a !== void 0 ? _a : '';
        const toCommit = (_b = options.toCommit) !== null && _b !== void 0 ? _b : 'head';
        const paths = (_c = options.paths) !== null && _c !== void 0 ? _c : ['.'];
        const template = {
            hash: '%H',
            parent: '%P',
            title: '%s',
            authorName: '%aN',
            committerRelativeDate: '%cr',
        };
        // We use random \u200b character (zero-width space) instead of double quotes
        // because we need to know which quotes to escape before we pass it to `JSON.parse`.
        // Otherwise, double quotes in commits message would cause this function to throw JSON exceptions.
        const format = ',{' +
            Object.entries(template)
                .map(([key, value]) => `\u200b${key}\u200b:\u200b${value}\u200b`)
                .join(',') +
            '}';
        const { stdout } = await this.runAsync([
            'log',
            `--pretty=format:${format}`,
            `${fromCommit}..${toCommit}`,
            '--',
            ...paths,
        ]);
        // Remove comma at the beginning, escape double quotes and replace \u200b with unescaped double quotes.
        const jsonItemsString = stdout
            .slice(1)
            .replace(/"/g, '\\"')
            .replace(/\u200b/gu, '"');
        return JSON.parse(`[${jsonItemsString}]`);
    }
    /**
     * Returns a list of files that have been modified, deleted or added between specified commits.
     */
    async logFilesAsync(options = {}) {
        var _a, _b;
        const fromCommit = (_a = options.fromCommit) !== null && _a !== void 0 ? _a : '';
        const toCommit = (_b = options.toCommit) !== null && _b !== void 0 ? _b : 'HEAD';
        // This diff command returns a list of relative paths of files that have changed preceded by their status.
        // Status is just a letter, which is also a key of `GitFileStatus` enum.
        const { stdout } = await this.runAsync([
            'diff',
            '--name-status',
            `${fromCommit}..${toCommit}`,
            '--relative',
            '--',
            '.',
        ]);
        return stdout
            .split(/\n/g)
            .filter(Boolean)
            .map((line) => {
            var _a;
            // Consecutive columns are separated by horizontal tabs.
            // In case of `R` (rename) status, there are three columns instead of two,
            // where the third is the new path after renaming and we should use the new one.
            const [status, relativePath, relativePathAfterRename] = line.split(/\t+/g);
            const newPath = relativePathAfterRename !== null && relativePathAfterRename !== void 0 ? relativePathAfterRename : relativePath;
            return {
                relativePath: newPath,
                path: path_1.default.join(this.path, newPath),
                // `R` status also has a number, but we take care of only the first character.
                status: (_a = GitFileStatus[status[0]]) !== null && _a !== void 0 ? _a : status,
            };
        });
    }
    /**
     * Adds files at given glob paths.
     */
    async addFilesAsync(paths) {
        if (!paths || paths.length === 0) {
            return;
        }
        await this.runAsync(['add', '--', ...paths]);
    }
    /**
     * Checkouts changes and cleans untracked files at given glob paths.
     */
    async discardFilesAsync(paths) {
        if (!paths || paths.length === 0) {
            return;
        }
        await this.runAsync(['checkout', '--', ...paths]);
        await this.runAsync(['clean', '-df', '--', ...paths]);
    }
    /**
     * Commits staged changes with given options including commit's title and body.
     */
    async commitAsync(options) {
        const args = ['commit', '--message', options.title];
        if (options.body) {
            args.push('--message', options.body);
        }
        await this.runAsync(args);
    }
    /**
     * Checks how many commits ahead and behind the former branch is relative to the latter.
     */
    async compareBranchesAsync(a, b) {
        const { stdout } = await this.runAsync(['rev-list', '--left-right', '--count', `${a}...${b}`]);
        const numbers = stdout
            .trim()
            .split(/\s+/g)
            .map((n) => +n);
        if (numbers.length !== 2) {
            throw new Error(`Oops, something went really wrong. Unable to parse "${stdout}"`);
        }
        const [ahead, behind] = numbers;
        return { ahead, behind };
    }
    /**
     * Resolves to boolean value meaning whether the repository contains any unstaged changes.
     */
    async hasUnstagedChangesAsync(paths = []) {
        return !(await this.tryAsync(['diff', '--quiet', '--', ...paths]));
    }
    /**
     * Returns a list of files with staged changes.
     */
    async getStagedFilesAsync() {
        const { stdout } = await this.runAsync(['diff', '--name-only', '--cached']);
        return stdout.trim().split(/\n+/g).filter(Boolean);
    }
    /**
     * Checks whether given commit is an ancestor of head commit.
     */
    async isAncestorAsync(commit) {
        return this.tryAsync(['merge-base', '--is-ancestor', commit, 'HEAD']);
    }
    /**
     * Finds the best common ancestor between the current ref and the given ref.
     */
    async mergeBaseAsync(ref) {
        const { stdout } = await this.runAsync(['merge-base', 'HEAD', ref]);
        return stdout.trim();
    }
    /**
     * Clones the repository but in a shallow way, which means
     * it downloads just one commit instead of the entire repository.
     * Returns `GitDirectory` instance of the cloned repository.
     */
    static async shallowCloneAsync(directory, remoteUrl, ref = 'master') {
        const git = new GitDirectory(directory);
        await fs_extra_1.default.mkdirs(directory);
        await git.initAsync();
        await git.addRemoteAsync('origin', remoteUrl);
        await git.fetchAsync({ depth: 1, remote: 'origin', ref });
        await git.checkoutAsync('FETCH_HEAD');
        return git;
    }
}
exports.GitDirectory = GitDirectory;
exports.default = new GitDirectory(Constants_1.EXPO_DIR);
//# sourceMappingURL=Git.js.map