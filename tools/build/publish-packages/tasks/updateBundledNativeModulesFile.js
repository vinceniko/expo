"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBundledNativeModulesFile = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../../Constants");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
const { magenta, green, gray, cyan } = chalk_1.default;
/**
 * Updates `bundledNativeModules.json` file in `expo` package.
 * It's used internally by some `expo-cli` commands so we know which package versions are compatible with `expo` version.
 */
exports.updateBundledNativeModulesFile = new TasksRunner_1.Task({
    name: 'updateBundledNativeModulesFile',
    dependsOn: [selectPackagesToPublish_1.selectPackagesToPublish],
    filesToStage: ['packages/expo/bundledNativeModules.json'],
}, async (parcels) => {
    const bundledNativeModulesPath = path_1.default.join(Constants_1.EXPO_DIR, 'packages/expo/bundledNativeModules.json');
    const bundledNativeModules = await json_file_1.default.readAsync(bundledNativeModulesPath);
    Logger_1.default.info(`\n✏️  Updating ${magenta.bold('bundledNativeModules.json')} file...`);
    for (const { pkg, state } of parcels) {
        const currentRange = bundledNativeModules[pkg.packageName];
        const newRange = `~${state.releaseVersion}`;
        if (!currentRange) {
            Logger_1.default.log('  ', green(pkg.packageName), gray('is not defined.'));
            continue;
        }
        Logger_1.default.log('  ', green(pkg.packageName), `${cyan.bold(currentRange)} -> ${cyan.bold(newRange)}`);
        bundledNativeModules[pkg.packageName] = newRange;
    }
    await json_file_1.default.writeAsync(bundledNativeModulesPath, bundledNativeModules);
});
//# sourceMappingURL=updateBundledNativeModulesFile.js.map