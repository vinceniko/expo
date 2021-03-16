"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRepositoryStatus = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const Git_1 = __importDefault(require("../../Git"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const { cyan, yellow, blue } = chalk_1.default;
/**
 * Checks whether the current branch is correct and working dir is not dirty.
 */
exports.checkRepositoryStatus = new TasksRunner_1.Task({
    name: 'checkRepositoryStatus',
    required: true,
    backupable: false,
}, async (parcels, options) => {
    if (options.skipRepoChecks) {
        return;
    }
    Logger_1.default.info(`\n🕵️‍♂️ Checking repository status...`);
    const currentBranch = await Git_1.default.getCurrentBranchNameAsync();
    const trackingBranch = await Git_1.default.getTrackingBranchNameAsync();
    // Check whether it's allowed to publish from the current branch.
    if (!(await checkBranchNameAsync(currentBranch))) {
        return TasksRunner_1.Task.STOP;
    }
    // If tracking branch is set, then we must ensure it is still up-to-date with it.
    if (trackingBranch) {
        await Git_1.default.fetchAsync();
        const stats = await Git_1.default.compareBranchesAsync(currentBranch, trackingBranch);
        if (stats.ahead + stats.behind > 0) {
            Logger_1.default.error(`🚫 Your local branch ${cyan(currentBranch)} is out of sync with remote branch.`);
            return TasksRunner_1.Task.STOP;
        }
    }
    if (await Git_1.default.hasUnstagedChangesAsync()) {
        Logger_1.default.error(`🚫 Repository contains unstaged changes, please make sure to have it clear.`);
        Logger_1.default.error(`🚫 If you want to include them, they must be committed.`);
        return TasksRunner_1.Task.STOP;
    }
});
/**
 * Checks whether the command is run on master branch or package side-branch.
 * Otherwise, it prompts to confirm that you know what you're doing.
 * On CI it returns `true` only if run on `master` branch.
 */
async function checkBranchNameAsync(branchName) {
    if (process.env.CI) {
        // CI is allowed to publish only from master.
        return branchName === 'master';
    }
    // Publishes can be run on `master` or package's side-branches like `expo-package/1.x.x`
    if (branchName === 'master' || /^[\w\-@]+\/\d+\.(x\.x|\d+\.x)$/.test(branchName)) {
        return true;
    }
    Logger_1.default.warn('⚠️ ', `It's recommended to publish from ${blue('master')} branch, while you're at ${blue(branchName)}`);
    const { confirmed } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            prefix: yellow('⚠️ '),
            message: yellow(`Do you want to proceed?`),
            default: true,
        },
    ]);
    Logger_1.default.log();
    return confirmed;
}
//# sourceMappingURL=checkRepositoryStatus.js.map