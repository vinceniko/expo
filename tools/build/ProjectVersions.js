"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBundledVersionsAsync = exports.getBundledVersionsAsync = exports.getNextSDKVersionAsync = exports.getNewestSDKVersionAsync = exports.getOldestSDKVersionAsync = exports.getSDKVersionsAsync = exports.getHomeSDKVersionAsync = exports.androidAppVersionAsync = exports.iosAppVersionAsync = exports.sdkVersionAsync = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const plist_1 = __importDefault(require("plist"));
const semver_1 = __importDefault(require("semver"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const Constants_1 = require("./Constants");
const BUNDLED_NATIVE_MODULES_PATH = path_1.default.join(Constants_1.PACKAGES_DIR, 'expo', 'bundledNativeModules.json');
async function sdkVersionAsync() {
    const packageJson = await json_file_1.default.readAsync(path_1.default.join(Constants_1.EXPO_DIR, 'packages/expo/package.json'));
    return packageJson.version;
}
exports.sdkVersionAsync = sdkVersionAsync;
async function iosAppVersionAsync() {
    const infoPlistPath = path_1.default.join(Constants_1.EXPO_DIR, 'ios', 'Exponent', 'Supporting', 'Info.plist');
    const infoPlist = plist_1.default.parse(fs_extra_1.default.readFileSync(infoPlistPath, 'utf8'));
    const bundleVersion = infoPlist.CFBundleShortVersionString;
    if (!bundleVersion) {
        throw new Error(`"CFBundleShortVersionString" not found in plist: ${infoPlistPath}`);
    }
    return bundleVersion;
}
exports.iosAppVersionAsync = iosAppVersionAsync;
async function androidAppVersionAsync() {
    const buildGradlePath = path_1.default.join(Constants_1.ANDROID_DIR, 'app', 'build.gradle');
    const buildGradleContent = await fs_extra_1.default.readFile(buildGradlePath, 'utf8');
    const match = buildGradleContent.match(/versionName ['"]([^'"]+?)['"]/);
    if (!match) {
        throw new Error("Can't obtain `versionName` from app's build.gradle");
    }
    return match[1];
}
exports.androidAppVersionAsync = androidAppVersionAsync;
async function getHomeSDKVersionAsync() {
    var _a;
    const homeAppJsonPath = path_1.default.join(Constants_1.EXPO_DIR, 'home', 'app.json');
    const appJson = (await json_file_1.default.readAsync(homeAppJsonPath, { json5: true }));
    if ((_a = appJson === null || appJson === void 0 ? void 0 : appJson.expo) === null || _a === void 0 ? void 0 : _a.sdkVersion) {
        return appJson.expo.sdkVersion;
    }
    throw new Error(`Home's SDK version not found!`);
}
exports.getHomeSDKVersionAsync = getHomeSDKVersionAsync;
async function getSDKVersionsAsync(platform) {
    const sdkVersionsPath = path_1.default.join(Constants_1.EXPO_DIR, platform === 'ios' ? 'ios/Exponent/Supporting' : 'android', 'sdkVersions.json');
    if (!(await fs_extra_1.default.pathExists(sdkVersionsPath))) {
        throw new Error(`File at path "${sdkVersionsPath}" not found.`);
    }
    const { sdkVersions } = (await json_file_1.default.readAsync(sdkVersionsPath));
    return sdkVersions;
}
exports.getSDKVersionsAsync = getSDKVersionsAsync;
async function getOldestSDKVersionAsync(platform) {
    const sdkVersions = await getSDKVersionsAsync(platform);
    return sdkVersions.sort(semver_1.default.compare)[0];
}
exports.getOldestSDKVersionAsync = getOldestSDKVersionAsync;
async function getNewestSDKVersionAsync(platform) {
    const sdkVersions = await getSDKVersionsAsync(platform);
    return sdkVersions.sort(semver_1.default.rcompare)[0];
}
exports.getNewestSDKVersionAsync = getNewestSDKVersionAsync;
async function getNextSDKVersionAsync(platform) {
    const newestVersion = await getNewestSDKVersionAsync(platform);
    if (!newestVersion) {
        return;
    }
    return `${semver_1.default.major(semver_1.default.inc(newestVersion, 'major'))}.0.0`;
}
exports.getNextSDKVersionAsync = getNextSDKVersionAsync;
/**
 * Returns an object with versions of bundled native modules.
 */
async function getBundledVersionsAsync() {
    return require(BUNDLED_NATIVE_MODULES_PATH);
}
exports.getBundledVersionsAsync = getBundledVersionsAsync;
/**
 * Updates bundled native modules versions.
 */
async function updateBundledVersionsAsync(patch) {
    await json_file_1.default.mergeAsync(BUNDLED_NATIVE_MODULES_PATH, patch);
}
exports.updateBundledVersionsAsync = updateBundledVersionsAsync;
//# sourceMappingURL=ProjectVersions.js.map