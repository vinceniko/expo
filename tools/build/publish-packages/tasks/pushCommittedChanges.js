"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushCommittedChanges = void 0;
const Git_1 = __importDefault(require("../../Git"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const commitStagedChanges_1 = require("./commitStagedChanges");
/**
 * Pushes committed changes to remote repo.
 */
exports.pushCommittedChanges = new TasksRunner_1.Task({
    name: 'pushCommittedChanges',
    dependsOn: [commitStagedChanges_1.commitStagedChanges],
}, async (parcels, options) => {
    Logger_1.default.info('\n🏋️  Pushing committed changes to remote repository...');
    if (options.dry) {
        Logger_1.default.debug('   Skipping due to --dry flag...');
        return;
    }
    const currentBranch = await Git_1.default.getCurrentBranchNameAsync();
    await Git_1.default.pushAsync({ track: currentBranch });
});
//# sourceMappingURL=pushCommittedChanges.js.map