"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cutOffChangelogs = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const resolveReleaseTypeAndVersion_1 = require("./resolveReleaseTypeAndVersion");
const { green, gray } = chalk_1.default;
/**
 * Cuts off changelogs - renames unpublished section header
 * to the new version and adds new unpublished section on top.
 */
exports.cutOffChangelogs = new TasksRunner_1.Task({
    name: 'cutOffChangelogs',
    dependsOn: [resolveReleaseTypeAndVersion_1.resolveReleaseTypeAndVersion],
    filesToStage: ['packages/**/CHANGELOG.md'],
}, async (parcels) => {
    Logger_1.default.info('\n✂️  Cutting off changelogs...');
    await Promise.all(parcels.map(async ({ pkg, changelog, state }) => {
        if (!state.releaseVersion) {
            return;
        }
        let skipReason = '';
        if (await changelog.fileExistsAsync()) {
            const versions = await changelog.getVersionsAsync();
            // This prevents unnecessary cut-offs when that version was already cutted off.
            // Maybe we should move "unpublished" entries to this version? It's probably too rare to worry about it.
            if (!versions.includes(state.releaseVersion)) {
                Logger_1.default.log('  ', green(pkg.packageName) + '...');
                await changelog.cutOffAsync(state.releaseVersion);
                await changelog.saveAsync();
                return;
            }
            skipReason = 'version already exists';
        }
        else {
            skipReason = 'no changelog file';
        }
        Logger_1.default.log('  ', green(pkg.packageName), gray(`- skipped, ${skipReason}`));
    }));
});
//# sourceMappingURL=cutOffChangelogs.js.map