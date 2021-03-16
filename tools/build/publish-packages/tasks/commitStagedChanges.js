"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitStagedChanges = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Git_1 = __importDefault(require("../../Git"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const resolveReleaseTypeAndVersion_1 = require("./resolveReleaseTypeAndVersion");
const { blue } = chalk_1.default;
/**
 * Commits staged changes made by all previous tasks.
 */
exports.commitStagedChanges = new TasksRunner_1.Task({
    name: 'commitStagedChanges',
    dependsOn: [resolveReleaseTypeAndVersion_1.resolveReleaseTypeAndVersion],
}, async (parcels, options) => {
    const stagedFiles = await Git_1.default.getStagedFilesAsync();
    if (stagedFiles.length === 0) {
        // This may happen if versions have already been updated — manually or by previous publish
        // that failed after committing and pushing to remote. It's safe to just skip this step
        // and use the current head commit as the publish commit.
        Logger_1.default.info(`\n📼 Nothing to commit — using previous commit as the publish commit`);
        return;
    }
    const commitMessage = commitMessageForOptions(options);
    const commitDescription = parcels
        .map(({ pkg, state }) => `${pkg.packageName}@${state.releaseVersion}`)
        .join('\n');
    Logger_1.default.info(`\n📼 Committing changes with message: ${blue(commitMessage)}`);
    await Git_1.default.commitAsync({
        title: commitMessage,
        body: commitDescription,
    });
});
/**
 * If commit message was provided as an option then it's returned.
 * Otherwise it is auto-generated based on provided package names.
 */
function commitMessageForOptions(options) {
    if (options.commitMessage) {
        return options.commitMessage;
    }
    if (0 < options.packageNames.length && options.packageNames.length < 4) {
        return `Publish ${options.packageNames.join(', ')}`;
    }
    return 'Publish packages';
}
//# sourceMappingURL=commitStagedChanges.js.map