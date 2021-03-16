"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAndroidProjects = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../../Constants");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Transforms_1 = require("../../Transforms");
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
const { yellow, magenta } = chalk_1.default;
/**
 * Updates version props in packages containing Android's native code.
 */
exports.updateAndroidProjects = new TasksRunner_1.Task({
    name: 'updateAndroidProjects',
    dependsOn: [selectPackagesToPublish_1.selectPackagesToPublish],
    filesToStage: ['packages/**/android/build.gradle'],
}, async (parcels) => {
    Logger_1.default.info('\n🤖 Updating Android projects...');
    for (const { pkg, state } of parcels) {
        const gradlePath = path_1.default.join(pkg.path, 'android/build.gradle');
        // Some packages don't have android code.
        if (!(await fs_extra_1.default.pathExists(gradlePath))) {
            continue;
        }
        const relativeGradlePath = path_1.default.relative(Constants_1.EXPO_DIR, gradlePath);
        Logger_1.default.log('  ', `Updating ${yellow('version')} in ${magenta(relativeGradlePath)}`);
        await Transforms_1.transformFileAsync(gradlePath, [
            {
                // update version and versionName in android/build.gradle
                find: /\b(version\s*=\s*|versionName\s+)(['"])(.*?)\2/g,
                replaceWith: `$1$2${state.releaseVersion}$2`,
            },
        ]);
    }
});
//# sourceMappingURL=updateAndroidProjects.js.map