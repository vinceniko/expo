"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
const ProjectTemplates_1 = require("../ProjectTemplates");
const ProjectVersions_1 = require("../ProjectVersions");
const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];
const BUNDLED_NATIVE_MODULES_PATH = path_1.default.join(Constants_1.PACKAGES_DIR, 'expo', 'bundledNativeModules.json');
/**
 * Finds target version range, that is usually `bundledModuleVersion` param,
 * but in some specific cases we want to use different version range.
 *
 * @param targetVersionRange Version range that exists in `bundledNativeModules.json` file.
 * @param currentVersion Version range that is currenty used in the template.
 * @param sdkVersion SDK version string to which we're upgrading.
 */
function resolveTargetVersionRange(targetVersionRange, currentVersion, sdkVersion) {
    if (currentVersion === '*') {
        return currentVersion;
    }
    if (/^https?:\/\/.*\/react-native\//.test(currentVersion)) {
        return `https://github.com/expo/react-native/archive/sdk-${sdkVersion}.tar.gz`;
    }
    return targetVersionRange;
}
/**
 * Updates single project template.
 *
 * @param template Template object containing name and path.
 * @param modulesToUpdate An object with module names to update and their version ranges.
 * @param sdkVersion SDK version string to which we're upgrading.
 */
async function updateTemplateAsync(template, modulesToUpdate, sdkVersion) {
    console.log(`Updating ${chalk_1.default.bold.green(template.name)}...`);
    const packageJsonPath = path_1.default.join(template.path, 'package.json');
    const packageJson = require(packageJsonPath);
    for (const dependencyKey of DEPENDENCIES_KEYS) {
        const dependencies = packageJson[dependencyKey];
        if (!dependencies) {
            continue;
        }
        for (const dependencyName in dependencies) {
            const currentVersion = dependencies[dependencyName];
            const targetVersion = resolveTargetVersionRange(modulesToUpdate[dependencyName], currentVersion, sdkVersion);
            if (targetVersion) {
                if (targetVersion === currentVersion) {
                    console.log(chalk_1.default.yellow('>'), `Current version ${chalk_1.default.cyan(targetVersion)} of ${chalk_1.default.blue(dependencyName)} is up-to-date.`);
                }
                else {
                    console.log(chalk_1.default.yellow('>'), `Updating ${chalk_1.default.blue(dependencyName)} from ${chalk_1.default.cyan(currentVersion)} to ${chalk_1.default.cyan(targetVersion)}...`);
                    packageJson[dependencyKey][dependencyName] = targetVersion;
                }
            }
        }
    }
    await json_file_1.default.writeAsync(packageJsonPath, packageJson);
}
/**
 * Removes template's `yarn.lock` and runs `yarn`.
 *
 * @param templatePath Root path of the template.
 */
async function yarnTemplateAsync(templatePath) {
    console.log(chalk_1.default.yellow('>'), 'Yarning...');
    const yarnLockPath = path_1.default.join(templatePath, 'yarn.lock');
    if (await fs_extra_1.default.pathExists(yarnLockPath)) {
        // We do want to always install the newest possible versions that match bundledNativeModules versions,
        // so let's remove yarn.lock before updating re-yarning dependencies.
        await fs_extra_1.default.remove(yarnLockPath);
    }
    await spawn_async_1.default('yarn', [], {
        stdio: 'ignore',
        cwd: templatePath,
        env: process.env,
    });
}
async function action(options) {
    var _a;
    // At this point of the release process all platform should have the same newest SDK version.
    const sdkVersion = (_a = options.sdkVersion) !== null && _a !== void 0 ? _a : (await ProjectVersions_1.getNewestSDKVersionAsync('ios'));
    if (!sdkVersion) {
        throw new Error(`Cannot infer current SDK version - please use ${chalk_1.default.gray('--sdkVersion')} flag.`);
    }
    const bundledNativeModules = require(BUNDLED_NATIVE_MODULES_PATH);
    const templates = await ProjectTemplates_1.getAvailableProjectTemplatesAsync();
    const expoVersion = await ProjectVersions_1.sdkVersionAsync();
    const modulesToUpdate = {
        ...bundledNativeModules,
        expo: `~${expoVersion}`,
    };
    for (const template of templates) {
        await updateTemplateAsync(template, modulesToUpdate, sdkVersion);
        await yarnTemplateAsync(template.path);
        console.log(chalk_1.default.yellow('>'), chalk_1.default.green('Success!'), '\n');
    }
}
exports.default = (program) => {
    program
        .command('update-project-templates')
        .alias('update-templates', 'upt')
        .description('Updates dependencies of project templates to the versions that are defined in `bundledNativeModules.json` file.')
        .option('-s, --sdkVersion [string]', 'SDK version for which the project templates should be updated. Defaults to the newest SDK version.')
        .asyncAction(action);
};
//# sourceMappingURL=UpdateProjectTemplates.js.map