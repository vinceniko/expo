"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePackageVersions = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
const { magenta, cyan, green } = chalk_1.default;
/**
 * Updates versions in packages selected to be published.
 */
exports.updatePackageVersions = new TasksRunner_1.Task({
    name: 'updatePackageVersions',
    dependsOn: [selectPackagesToPublish_1.selectPackagesToPublish],
    filesToStage: ['packages/**/package.json'],
}, async (parcels) => {
    Logger_1.default.info(`\n🆙 Updating versions in ${magenta.bold('package.json')}s...`);
    await Promise.all(parcels.map(async ({ pkg, state }) => {
        await json_file_1.default.setAsync(path_1.default.join(pkg.path, 'package.json'), 'version', state.releaseVersion);
        Logger_1.default.log('  ', `${green(pkg.packageName)}:`, `${cyan.bold(pkg.packageVersion)} -> ${cyan.bold(state.releaseVersion)}`);
    }));
});
//# sourceMappingURL=updatePackageVersions.js.map