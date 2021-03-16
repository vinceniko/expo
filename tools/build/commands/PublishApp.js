"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const xdl_1 = require("@expo/xdl");
const Directories_1 = require("../Directories");
const ProjectVersions_1 = require("../ProjectVersions");
const inquirer_1 = __importDefault(require("inquirer"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const APPS_DIR = Directories_1.getAppsDir();
async function getDefaultSDKVersionAsync() {
    const defaultIosSdkVersion = await ProjectVersions_1.getNewestSDKVersionAsync('ios');
    const defaultAndroidSdkVersion = await ProjectVersions_1.getNewestSDKVersionAsync('android');
    if (!defaultIosSdkVersion || !defaultAndroidSdkVersion) {
        throw new Error(`Unable to find newest SDK version. You must use ${chalk_1.default.red('--sdkVersion')} option.`);
    }
    return semver_1.default.gt(defaultIosSdkVersion, defaultAndroidSdkVersion)
        ? defaultIosSdkVersion
        : defaultAndroidSdkVersion;
}
function getExpoStatePaths() {
    const originalPath = xdl_1.UserSettings.userSettingsFile();
    const backupPath = path_1.default.join(path_1.default.dirname(originalPath), 'state-backup.json');
    return { originalPath, backupPath };
}
async function backupExpoStateAsync() {
    const { originalPath, backupPath } = getExpoStatePaths();
    await fs_extra_1.default.copy(originalPath, backupPath);
}
async function restoreExpoStateAsync() {
    const { originalPath, backupPath } = getExpoStatePaths();
    await fs_extra_1.default.move(backupPath, originalPath, { overwrite: true });
}
async function askForPasswordAsync(user) {
    const { password } = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'password',
            message: `Provide a password to ${chalk_1.default.green(user)}:`,
        },
    ]);
    return password;
}
async function loginAndPublishAsync(options) {
    const appRootPath = path_1.default.join(APPS_DIR, options.app);
    const password = await askForPasswordAsync(options.user);
    console.log(`Logging in as ${chalk_1.default.green(options.user)}...`);
    await xdl_1.UserManager.loginAsync('user-pass', { username: options.user, password });
    const appJson = new json_file_1.default(path_1.default.join(appRootPath, 'app.json'));
    const appSdkVersion = (await appJson.getAsync('expo.sdkVersion', null));
    if (appSdkVersion !== options.sdkVersion) {
        console.log(`App's ${chalk_1.default.yellow('expo.sdkVersion')} was set to ${chalk_1.default.blue(appSdkVersion)}, changing to ${chalk_1.default.blue(options.sdkVersion)}...`);
        await appJson.setAsync('expo.sdkVersion', options.sdkVersion);
    }
    console.log(`Publishing ${chalk_1.default.cyan(options.app)} to ${chalk_1.default.green(options.user)} account...`);
    try {
        await spawn_async_1.default('expo', ['publish'], {
            cwd: appRootPath,
            stdio: 'inherit',
            env: {
                ...process.env,
                EXPO_NO_DOCTOR: '1',
            },
        });
    }
    catch (error) {
        throw error;
    }
    finally {
        if (appSdkVersion !== options.sdkVersion) {
            console.log(`Reverting ${chalk_1.default.yellow('expo.sdkVersion')} to ${chalk_1.default.blue(appSdkVersion)}...`);
            await appJson.setAsync('expo.sdkVersion', appSdkVersion);
        }
    }
}
async function action(options) {
    if (!options.app) {
        throw new Error('Run with `--app <string>`.');
    }
    const allowedApps = (await fs_extra_1.default.readdir(APPS_DIR)).filter((item) => fs_extra_1.default.lstatSync(path_1.default.join(APPS_DIR, item)).isDirectory());
    if (!allowedApps.includes(options.app)) {
        throw new Error(`App not found at ${chalk_1.default.cyan(options.app)} directory. Allowed app names: ${allowedApps
            .map((appDirname) => chalk_1.default.green(appDirname))
            .join(', ')}`);
    }
    const sdkVersion = options.sdkVersion || (await getDefaultSDKVersionAsync());
    if (!sdkVersion) {
        throw new Error('Next SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
    }
    if (!options.sdkVersion) {
        console.log(`SDK version not provided - defaulting to ${chalk_1.default.cyan(sdkVersion)}`);
    }
    const initialUser = await xdl_1.UserManager.getCurrentUserAsync();
    if (initialUser) {
        console.log(`You're currently logged in as ${chalk_1.default.green(initialUser.username)} in ${chalk_1.default.cyan('expo-cli')} - backing up your user's session...`);
        await backupExpoStateAsync();
    }
    try {
        await loginAndPublishAsync({ ...options, sdkVersion });
    }
    catch (error) {
        throw error;
    }
    finally {
        if (initialUser) {
            console.log(`Restoring ${chalk_1.default.green(initialUser.username)} session in ${chalk_1.default.cyan('expo-cli')}...`);
            await restoreExpoStateAsync();
        }
        else {
            console.log(`Logging out from ${chalk_1.default.green(options.user)} account...`);
            await xdl_1.UserManager.logoutAsync();
        }
    }
}
exports.default = (program) => {
    program
        .command('publish-app')
        .alias('pub-app', 'pa')
        .description(`Publishes an app from ${chalk_1.default.magenta('apps')} folder.`)
        .option('-a, --app <string>', 'Specifies a name of the app to publish.')
        .option('-u, --user <string>', 'Specifies a username of Expo account on which to publish the app.')
        .option('-s, --sdkVersion [string]', 'SDK version the published app should use. Defaults to the newest available SDK version.')
        .asyncAction(action);
};
//# sourceMappingURL=PublishApp.js.map