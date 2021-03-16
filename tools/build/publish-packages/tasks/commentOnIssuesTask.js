"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentOnIssuesTask = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const Changelogs_1 = require("../../Changelogs");
const Constants_1 = require("../../Constants");
const Formatter_1 = require("../../Formatter");
const Git_1 = __importDefault(require("../../Git"));
const GitHubActions_1 = require("../../GitHubActions");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
/**
 * Dispatches GitHub Actions workflow that adds comments to the issues
 * that were closed by pull requests mentioned in the changelog changes.
 */
exports.commentOnIssuesTask = new TasksRunner_1.Task({
    name: 'commentOnIssuesTask',
    dependsOn: [selectPackagesToPublish_1.selectPackagesToPublish],
    backupable: true,
}, async (parcels, options) => {
    Logger_1.default.info('\n🐙 Commenting on issues closed by published changes');
    const payload = await generatePayloadForCommentatorAsync(parcels, options.tag);
    if (!payload.length) {
        Logger_1.default.log('There are no closed issues to comment on\n');
        return;
    }
    if (options.dry) {
        Logger_1.default.debug('Skipping due to --dry flag');
        logManualFallback(payload);
        return;
    }
    if (!process.env.GITHUB_TOKEN) {
        Logger_1.default.error('Environment variable `%s` must be set to dispatch a commentator workflow', chalk_1.default.magenta('GITHUB_TOKEN'));
        logManualFallback(payload);
        return;
    }
    const currentBranchName = await Git_1.default.getCurrentBranchNameAsync();
    // Sometimes we publish from different branches (especially for testing) where comments are not advisable.
    if (currentBranchName !== 'master') {
        Logger_1.default.warn('This feature is disabled on branches other than master');
        logManualFallback(payload);
        return;
    }
    // Dispatch commentator workflow on GitHub Actions with stringified and escaped payload.
    await GitHubActions_1.dispatchWorkflowEventAsync('commentator.yml', currentBranchName, {
        payload: JSON.stringify(payload).replace(/("|`)/g, '\\$1'),
    });
    Logger_1.default.success('Successfully dispatched commentator action for the following issues: %s', linksToClosedIssues(payload.map(({ issue }) => issue)));
});
/**
 * Generates payload for `expotools commentator` command.
 */
async function generatePayloadForCommentatorAsync(parcels, tag) {
    var _a;
    // An object whose key is the issue number and value is an array of rows to put in the comment's body.
    const commentRows = {};
    // An object whose key is the pull request number and value is an array of issues it closes.
    const closedIssuesRegistry = {};
    for (const { pkg, state } of parcels) {
        const versionChanges = (_a = state.changelogChanges) === null || _a === void 0 ? void 0 : _a.versions[Changelogs_1.UNPUBLISHED_VERSION_NAME];
        if (!versionChanges) {
            continue;
        }
        const allEntries = [].concat(...Object.values(versionChanges));
        const allPullRequests = new Set([].concat(...allEntries.map((entry) => { var _a; return (_a = entry.pullRequests) !== null && _a !== void 0 ? _a : []; })));
        // Visit all pull requests mentioned in the changelog.
        for (const pullRequest of allPullRequests) {
            // Look for closed issues just once per pull request to reduce number of GitHub API calls.
            if (!closedIssuesRegistry[pullRequest]) {
                closedIssuesRegistry[pullRequest] = await GitHubActions_1.getClosedIssuesAsync(pullRequest);
            }
            const closedIssues = closedIssuesRegistry[pullRequest];
            // Visit all issues that have been closed by this pull request.
            for (const issue of closedIssues) {
                if (!commentRows[issue]) {
                    commentRows[issue] = [];
                }
                // Check if the row for the package already exists. If it does, then just add
                // another pull request reference into that row instead of creating a new one.
                // This is to prevent duplicating packages within the comment's body.
                const existingRowForPackage = commentRows[issue].find((entry) => entry.pkg === pkg);
                if (existingRowForPackage) {
                    existingRowForPackage.pullRequests.push(pullRequest);
                }
                else {
                    commentRows[issue].push({
                        pkg,
                        version: state.releaseVersion,
                        pullRequests: [pullRequest],
                    });
                }
            }
        }
    }
    return Object.entries(commentRows).map(([issue, entries]) => {
        return {
            issue: +issue,
            body: generateCommentBody(entries, tag),
        };
    });
}
/**
 * Logs a list of closed issues. We use it as a fallback in several places, so it's extracted.
 */
function logManualFallback(payload) {
    Logger_1.default.log('If necessary, you can still do this manually on the following issues: %s', linksToClosedIssues(payload.map(({ issue }) => issue)));
}
/**
 * Returns a string with concatenated links to all given issues.
 */
function linksToClosedIssues(issues) {
    return issues
        .map((issue) => Formatter_1.link(chalk_1.default.blue('#' + issue), `https://github.com/expo/expo/issues/${issue}`))
        .join(', ');
}
/**
 * Generates comment body based on given entries.
 */
function generateCommentBody(entries, tag) {
    const rows = entries.map(({ pkg, version, pullRequests }) => {
        const items = [
            linkToNpmPackage(pkg.packageName, version),
            version,
            pullRequests.map((pr) => '#' + pr).join(', '),
            linkToChangelog(pkg),
        ];
        return `| ${items.join(' | ')} |`;
    });
    return `<!-- Generated by \`expotools publish\` -->
Some changes in the following packages that may fix this issue have just been published to npm under \`${tag}\` tag 🚀

| 📦 Package | 🔢 Version | ↖️ Pull requests | 📝 Release notes |
|:--:|:--:|:--:|:--:|
${rows.join('\n')}

If you're using bare workflow you can upgrade them right away. We kindly ask you for some feedback—even if it works 🙏

They will become available in managed workflow with the next SDK release 👀

Happy Coding! 🎉`;
}
/**
 * Returns markdown link to the package on npm.
 */
function linkToNpmPackage(packageName, version) {
    return `[${packageName}](https://www.npmjs.com/package/${packageName}/v/${version})`;
}
/**
 * Returns markdown link to package's changelog.
 */
function linkToChangelog(pkg) {
    const changelogRelativePath = path_1.default.relative(Constants_1.EXPO_DIR, pkg.changelogPath);
    return `[CHANGELOG.md](https://github.com/expo/expo/blob/master/${changelogRelativePath})`;
}
//# sourceMappingURL=commentOnIssuesTask.js.map