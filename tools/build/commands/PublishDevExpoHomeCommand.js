"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const semver_1 = __importDefault(require("semver"));
const ExpoCLI = __importStar(require("../ExpoCLI"));
const Utils_1 = require("../Utils");
const ProjectVersions_1 = require("../ProjectVersions");
const expotools_1 = require("../expotools");
const EXPO_HOME_PATH = expotools_1.Directories.getExpoHomeJSDir();
const { EXPO_HOME_DEV_ACCOUNT_USERNAME, EXPO_HOME_DEV_ACCOUNT_PASSWORD } = process_1.default.env;
/**
 * Finds target SDK version for home app based on the newest SDK versions of all supported platforms.
 * If multiple different versions have been found then the highest one is used.
 */
async function findTargetSdkVersionAsync() {
    const iosSdkVersion = await ProjectVersions_1.getNewestSDKVersionAsync('ios');
    const androidSdkVersion = await ProjectVersions_1.getNewestSDKVersionAsync('android');
    if (!iosSdkVersion || !androidSdkVersion) {
        throw new Error('Unable to find target SDK version.');
    }
    const sdkVersions = [iosSdkVersion, androidSdkVersion];
    return sdkVersions.sort(semver_1.default.rcompare)[0];
}
/**
 * Sets `sdkVersion` and `version` fields in app configuration if needed.
 */
async function maybeUpdateHomeSdkVersionAsync(appJson) {
    const targetSdkVersion = await findTargetSdkVersionAsync();
    if (appJson.expo.sdkVersion !== targetSdkVersion) {
        console.log(`Updating home's sdkVersion to ${chalk_1.default.cyan(targetSdkVersion)}...`);
        // When publishing the sdkVersion needs to be set to the target sdkVersion. The Expo client will
        // load it as UNVERSIONED, but the server uses this field to know which clients to serve the
        // bundle to.
        appJson.expo.version = targetSdkVersion;
        appJson.expo.sdkVersion = targetSdkVersion;
    }
}
/**
 * Returns path to production's expo-cli state file.
 */
function getExpoCliStatePath() {
    return path_1.default.join(os_1.default.homedir(), '.expo/state.json');
}
/**
 * Reads expo-cli state file which contains, among other things, session credentials to the account that you're logged in.
 */
async function getExpoCliStateAsync() {
    return json_file_1.default.readAsync(getExpoCliStatePath());
}
/**
 * Sets expo-cli state file which contains, among other things, session credentials to the account that you're logged in.
 */
async function setExpoCliStateAsync(newState) {
    await json_file_1.default.writeAsync(getExpoCliStatePath(), newState);
}
/**
 * Deletes kernel fields that needs to be removed from published manifest.
 */
function deleteKernelFields(appJson) {
    console.log(`Deleting kernel-related fields...`);
    // @tsapeta: Using `delete` keyword here would change the order of keys in app.json.
    appJson.expo.kernel = undefined;
    appJson.expo.isKernel = undefined;
    appJson.expo.ios.publishBundlePath = undefined;
    appJson.expo.android.publishBundlePath = undefined;
}
/**
 * Restores kernel fields that have been removed in previous steps - we don't want them to be present in published manifest.
 */
function restoreKernelFields(appJson, appJsonBackup) {
    console.log('Restoring kernel-related fields...');
    appJson.expo.kernel = appJsonBackup.expo.kernel;
    appJson.expo.isKernel = appJsonBackup.expo.isKernel;
    appJson.expo.ios.publishBundlePath = appJsonBackup.expo.ios.publishBundlePath;
    appJson.expo.android.publishBundlePath = appJsonBackup.expo.android.publishBundlePath;
}
/**
 * Publishes dev home app.
 */
async function publishAppAsync(slug, url) {
    console.log(`Publishing ${chalk_1.default.green(slug)}...`);
    await expotools_1.XDL.publishProjectWithExpoCliAsync(EXPO_HOME_PATH, {
        userpass: {
            username: EXPO_HOME_DEV_ACCOUNT_USERNAME,
            password: EXPO_HOME_DEV_ACCOUNT_PASSWORD,
        },
    });
    console.log(`Done publishing ${chalk_1.default.green(slug)}. New home's app url is: ${chalk_1.default.blue(url)}`);
}
/**
 * Updates `dev-home-config.json` file with the new app url. It's then used by the client to load published home app.
 */
async function updateDevHomeConfigAsync(url) {
    const devHomeConfigFilename = 'dev-home-config.json';
    const devHomeConfigPath = path_1.default.join(expotools_1.Directories.getExpoRepositoryRootDir(), devHomeConfigFilename);
    const devManifestsFile = new json_file_1.default(devHomeConfigPath);
    console.log(`Updating dev home config at ${chalk_1.default.magenta(devHomeConfigFilename)}...`);
    await devManifestsFile.writeAsync({ url });
}
/**
 * Main action that runs once the command is invoked.
 */
async function action(options) {
    var _a;
    if (!EXPO_HOME_DEV_ACCOUNT_USERNAME) {
        throw new Error('EXPO_HOME_DEV_ACCOUNT_USERNAME must be set in your environment.');
    }
    if (!EXPO_HOME_DEV_ACCOUNT_PASSWORD) {
        throw new Error('EXPO_HOME_DEV_ACCOUNT_PASSWORD must be set in your environment.');
    }
    const expoHomeHash = await expotools_1.HashDirectory.hashDirectoryWithVersionsAsync(EXPO_HOME_PATH);
    const appJsonFilePath = path_1.default.join(EXPO_HOME_PATH, 'app.json');
    const slug = `expo-home-dev-${expoHomeHash}`;
    const url = `exp://expo.io/@${EXPO_HOME_DEV_ACCOUNT_USERNAME}/${slug}`;
    const appJsonFile = new json_file_1.default(appJsonFilePath);
    const appJson = await appJsonFile.readAsync();
    console.log(`Creating backup of ${chalk_1.default.magenta('app.json')} file...`);
    const appJsonBackup = Utils_1.deepCloneObject(appJson);
    console.log('Getting expo-cli state of the current session...');
    const cliStateBackup = await getExpoCliStateAsync();
    await maybeUpdateHomeSdkVersionAsync(appJson);
    console.log(`Modifying home's slug to ${chalk_1.default.green(slug)}...`);
    appJson.expo.slug = slug;
    deleteKernelFields(appJson);
    // Save the modified `appJson` to the file so it'll be used as a manifest.
    await appJsonFile.writeAsync(appJson);
    const cliUsername = (_a = cliStateBackup === null || cliStateBackup === void 0 ? void 0 : cliStateBackup.auth) === null || _a === void 0 ? void 0 : _a.username;
    if (cliUsername) {
        console.log(`Logging out from ${chalk_1.default.green(cliUsername)} account...`);
        await ExpoCLI.runExpoCliAsync('logout', [], {
            stdio: 'ignore',
        });
    }
    if (!options.dry) {
        await publishAppAsync(slug, url);
    }
    else {
        console.log(`Skipped publishing because of ${chalk_1.default.gray('--dry')} flag.`);
    }
    restoreKernelFields(appJson, appJsonBackup);
    console.log(`Restoring home's slug to ${chalk_1.default.green(appJsonBackup.expo.slug)}...`);
    appJson.expo.slug = appJsonBackup.expo.slug;
    if (cliUsername) {
        console.log(`Restoring ${chalk_1.default.green(cliUsername)} session in expo-cli...`);
        await setExpoCliStateAsync(cliStateBackup);
    }
    else {
        console.log(`Logging out from ${chalk_1.default.green(EXPO_HOME_DEV_ACCOUNT_USERNAME)} account...`);
        await fs_extra_1.default.remove(getExpoCliStatePath());
    }
    console.log(`Updating ${chalk_1.default.magenta('app.json')} file...`);
    await appJsonFile.writeAsync(appJson);
    await updateDevHomeConfigAsync(url);
    console.log(chalk_1.default.yellow(`Finished publishing. Remember to commit changes of ${chalk_1.default.magenta('home/app.json')} and ${chalk_1.default.magenta('dev-home-config.json')}.`));
}
exports.default = (program) => {
    program
        .command('publish-dev-home')
        .alias('pdh')
        .description(`Automatically logs in your expo-cli to ${chalk_1.default.magenta(EXPO_HOME_DEV_ACCOUNT_USERNAME)} account, publishes home app for development and logs back to your account.`)
        .option('-d, --dry', 'Whether to skip `expo publish` command. Despite this, some files might be changed after running this script.', false)
        .asyncAction(action);
};
//# sourceMappingURL=PublishDevExpoHomeCommand.js.map