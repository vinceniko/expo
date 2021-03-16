"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Constants_1 = require("../Constants");
const ProjectVersions_1 = require("../ProjectVersions");
const Directories_1 = require("../Directories");
const REACT_NATIVE_SUBMODULE_PATH = Directories_1.getReactNativeSubmoduleDir();
const REACT_ANDROID_PATH = path_1.default.join(Constants_1.ANDROID_DIR, 'ReactAndroid');
const REACT_COMMON_PATH = path_1.default.join(Constants_1.ANDROID_DIR, 'ReactCommon');
async function checkoutReactNativeSubmoduleAsync(checkoutRef) {
    await spawn_async_1.default('git', ['fetch'], {
        cwd: REACT_NATIVE_SUBMODULE_PATH,
    });
    await spawn_async_1.default('git', ['checkout', checkoutRef], {
        cwd: REACT_NATIVE_SUBMODULE_PATH,
    });
}
async function updateReactAndroidAsync(sdkVersion) {
    console.log(`Cleaning ${chalk_1.default.magenta(path_1.default.relative(Constants_1.EXPO_DIR, REACT_ANDROID_PATH))}...`);
    await fs_extra_1.default.remove(REACT_ANDROID_PATH);
    console.log(`Cleaning ${chalk_1.default.magenta(path_1.default.relative(Constants_1.EXPO_DIR, REACT_COMMON_PATH))}...`);
    await fs_extra_1.default.remove(REACT_COMMON_PATH);
    console.log(`Running ${chalk_1.default.blue('ReactAndroidCodeTransformer')} with ${chalk_1.default.yellow(`./gradlew :tools:execute --args ${sdkVersion}`)} command...`);
    await spawn_async_1.default('./gradlew', [':tools:execute', '--args', sdkVersion], {
        cwd: Constants_1.ANDROID_DIR,
        stdio: 'inherit',
    });
}
async function action(options) {
    if (options.checkout) {
        console.log(`Checking out ${chalk_1.default.magenta(path_1.default.relative(Constants_1.EXPO_DIR, REACT_NATIVE_SUBMODULE_PATH))} submodule at ${chalk_1.default.blue(options.checkout)} ref...`);
        await checkoutReactNativeSubmoduleAsync(options.checkout);
    }
    // When we're updating React Native, we mostly want it to be for the next SDK that isn't versioned yet.
    const androidSdkVersion = options.sdkVersion || (await ProjectVersions_1.getNextSDKVersionAsync('android'));
    if (!androidSdkVersion) {
        throw new Error('Cannot obtain next SDK version. Try to run with --sdkVersion <sdkVersion> flag.');
    }
    console.log(`Updating ${chalk_1.default.green('ReactAndroid')} for SDK ${chalk_1.default.cyan(androidSdkVersion)} ...`);
    await updateReactAndroidAsync(androidSdkVersion);
}
exports.default = (program) => {
    program
        .command('update-react-native')
        .alias('update-rn', 'urn')
        .description('Updates React Native submodule and applies Expo-specific code transformations on ReactAndroid and ReactCommon folders.')
        .option('-c, --checkout [string]', "Git's ref to the commit, tag or branch on which the React Native submodule should be checkouted.")
        .option('-s, --sdkVersion [string]', 'SDK version for which the forked React Native will be used. Defaults to the newest SDK version increased by a major update.')
        .asyncAction(action);
};
//# sourceMappingURL=UpdateReactNative.js.map