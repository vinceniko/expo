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
exports.getListOfPackagesAsync = exports.getPackageByName = exports.Package = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_promise_1 = __importDefault(require("glob-promise"));
const unversionablePackages_json_1 = __importDefault(require("./versioning/ios/unversionablePackages.json"));
const unversionablePackages_json_2 = __importDefault(require("./versioning/android/unversionablePackages.json"));
const Directories = __importStar(require("./Directories"));
const Npm = __importStar(require("./Npm"));
const CocoaPods_1 = require("./CocoaPods");
const ANDROID_DIR = Directories.getAndroidDir();
const IOS_DIR = Directories.getIosDir();
const PACKAGES_DIR = Directories.getPackagesDir();
/**
 * Cached list of packages or `null` if they haven't been loaded yet. See `getListOfPackagesAsync`.
 */
let cachedPackages = null;
/**
 * Represents a package in the monorepo.
 */
class Package {
    constructor(rootPath, packageJson) {
        this.path = rootPath;
        this.packageJson = packageJson || require(path_1.default.join(rootPath, 'package.json'));
        this.unimoduleJson = readUnimoduleJsonAtDirectory(rootPath);
    }
    get hasPlugin() {
        return fs_extra_1.default.pathExistsSync(path_1.default.join(this.path, 'plugin'));
    }
    get packageName() {
        return this.packageJson.name;
    }
    get packageVersion() {
        return this.packageJson.version;
    }
    get packageSlug() {
        return (this.unimoduleJson && this.unimoduleJson.name) || this.packageName;
    }
    get scripts() {
        return this.packageJson.scripts || {};
    }
    get podspecName() {
        var _a, _b;
        const iosConfig = {
            subdirectory: 'ios',
            ...((_b = (_a = this.unimoduleJson) === null || _a === void 0 ? void 0 : _a.ios) !== null && _b !== void 0 ? _b : {}),
        };
        // 'ios.podName' is actually not used anywhere in our unimodules, but let's have the same logic as react-native-unimodules script.
        if ('podName' in iosConfig) {
            return iosConfig.podName;
        }
        // Obtain podspecName by looking for podspecs
        const podspecPaths = glob_promise_1.default.sync('*.podspec', {
            cwd: path_1.default.join(this.path, iosConfig.subdirectory),
        });
        if (!podspecPaths || podspecPaths.length === 0) {
            return null;
        }
        return path_1.default.basename(podspecPaths[0], '.podspec');
    }
    get iosSubdirectory() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.unimoduleJson) === null || _a === void 0 ? void 0 : _a.ios) === null || _b === void 0 ? void 0 : _b.subdirectory) !== null && _c !== void 0 ? _c : 'ios';
    }
    get androidSubdirectory() {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.unimoduleJson) === null || _a === void 0 ? void 0 : _a.android) === null || _b === void 0 ? void 0 : _b.subdirectory) !== null && _c !== void 0 ? _c : 'android';
    }
    get androidPackageName() {
        var _a;
        if (!this.isSupportedOnPlatform('android')) {
            return null;
        }
        const buildGradle = fs_extra_1.default.readFileSync(path_1.default.join(this.path, this.androidSubdirectory, 'build.gradle'), 'utf8');
        const match = buildGradle.match(/^group ?= ?'([\w.]+)'\n/m);
        return (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : null;
    }
    get changelogPath() {
        return path_1.default.join(this.path, 'CHANGELOG.md');
    }
    isUnimodule() {
        return !!this.unimoduleJson;
    }
    isSupportedOnPlatform(platform) {
        var _a, _b;
        if (this.unimoduleJson) {
            return (_b = (_a = this.unimoduleJson.platforms) === null || _a === void 0 ? void 0 : _a.includes(platform)) !== null && _b !== void 0 ? _b : false;
        }
        else if (platform === 'android') {
            return fs_extra_1.default.existsSync(path_1.default.join(this.path, this.androidSubdirectory, 'build.gradle'));
        }
        else if (platform === 'ios') {
            return fs_extra_1.default
                .readdirSync(path_1.default.join(this.path, this.iosSubdirectory))
                .some((path) => path.endsWith('.podspec'));
        }
        return false;
    }
    isIncludedInExpoClientOnPlatform(platform) {
        if (platform === 'ios') {
            // On iOS we can easily check whether the package is included in Expo client by checking if it is installed by Cocoapods.
            const { podspecName } = this;
            return (podspecName != null &&
                fs_extra_1.default.pathExistsSync(path_1.default.join(IOS_DIR, 'Pods', 'Headers', 'Public', podspecName)));
        }
        else if (platform === 'android') {
            // On Android we need to read expoview's build.gradle file
            const buildGradle = fs_extra_1.default.readFileSync(path_1.default.join(ANDROID_DIR, 'expoview/build.gradle'), 'utf8');
            const match = buildGradle.search(new RegExp(`addUnimodulesDependencies\\([^\\)]+configuration\\s*:\\s*'api'[^\\)]+exclude\\s*:\\s*\\[[^\\]]*'${this.packageName}'[^\\]]*\\][^\\)]+\\)`));
            // this is somewhat brittle so we do a quick-and-dirty sanity check:
            // 'expo-in-app-purchases' should never be included so if we don't find a match
            // for that package, something is wrong.
            if (this.packageName === 'expo-in-app-purchases' && match === -1) {
                throw new Error("'isIncludedInExpoClientOnPlatform' is not behaving correctly, please check expoview/build.gradle format");
            }
            return match === -1;
        }
        throw new Error(`'isIncludedInExpoClientOnPlatform' is not supported on '${platform}' platform yet.`);
    }
    isVersionableOnPlatform(platform) {
        if (platform === 'ios') {
            return this.podspecName != null && !unversionablePackages_json_1.default.includes(this.packageName);
        }
        else if (platform === 'android') {
            return !unversionablePackages_json_2.default.includes(this.packageName);
        }
        throw new Error(`'isVersionableOnPlatform' is not supported on '${platform}' platform yet.`);
    }
    async getPackageViewAsync() {
        if (this.packageView !== undefined) {
            return this.packageView;
        }
        return await Npm.getPackageViewAsync(this.packageName, this.packageVersion);
    }
    getDependencies(includeAll = false) {
        const depsGroups = includeAll
            ? ['dependencies', 'devDependencies', 'peerDependencies', 'unimodulePeerDependencies']
            : ['dependencies'];
        const dependencies = depsGroups.map((group) => {
            const deps = this.packageJson[group];
            return !deps
                ? []
                : Object.entries(deps).map(([name, versionRange]) => {
                    return {
                        name,
                        group,
                        versionRange: versionRange,
                    };
                });
        });
        return [].concat(...dependencies);
    }
    dependsOn(packageName) {
        return this.getDependencies().some((dep) => dep.name === packageName);
    }
    /**
     * Iterates through dist tags returned by npm to determine an array of tags to which given version is bound.
     */
    async getDistTagsAsync(version = this.packageVersion) {
        var _a;
        const pkgView = await this.getPackageViewAsync();
        const distTags = (_a = pkgView === null || pkgView === void 0 ? void 0 : pkgView['dist-tags']) !== null && _a !== void 0 ? _a : {};
        return Object.keys(distTags).filter((tag) => distTags[tag] === version);
    }
    /**
     * Checks whether the package depends on a local pod with given name.
     */
    async hasLocalPodDependencyAsync(podName) {
        if (!podName) {
            return false;
        }
        const podspecPath = path_1.default.join(this.path, 'ios/Pods/Local Podspecs', `${podName}.podspec.json`);
        return await fs_extra_1.default.pathExists(podspecPath);
    }
    /**
     * Checks whether package has its own changelog file.
     */
    async hasChangelogAsync() {
        return fs_extra_1.default.pathExists(this.changelogPath);
    }
    /**
     * Checks whether package has any native code (iOS, Android, C++).
     */
    async isNativeModuleAsync() {
        const dirs = ['ios', 'android', 'cpp'].map((dir) => path_1.default.join(this.path, dir));
        for (const dir of dirs) {
            if (await fs_extra_1.default.pathExists(dir)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Checks whether package contains some native tests for Android.
     */
    async hasNativeTestsAsync(platform) {
        if (platform === 'android') {
            return fs_extra_1.default.pathExists(path_1.default.join(this.path, this.androidSubdirectory, 'src/test'));
        }
        // TODO(tsapeta): Support ios and web.
        throw new Error(`"hasNativeTestsAsync" for platform "${platform}" is not implemented yet.`);
    }
    /**
     * Checks whether package contains native instrumentation tests for Android.
     */
    async hasNativeInstrumentationTestsAsync(platform) {
        if (platform === 'android') {
            return fs_extra_1.default.pathExists(path_1.default.join(this.path, this.androidSubdirectory, 'src/androidTest'));
        }
        return false;
    }
    /**
     * Reads the podspec and returns it in JSON format
     * or `null` if the package doesn't have a podspec.
     */
    async getPodspecAsync() {
        const podspecName = this.podspecName;
        const podspecPath = path_1.default.join(this.path, this.iosSubdirectory, `${podspecName}.podspec`);
        if (!podspecName) {
            return null;
        }
        return await CocoaPods_1.readPodspecAsync(podspecPath);
    }
}
exports.Package = Package;
/**
 * Resolves to a Package instance if the package with given name exists in the repository.
 */
function getPackageByName(packageName) {
    const packageJsonPath = pathToLocalPackageJson(packageName);
    try {
        const packageJson = require(packageJsonPath);
        return new Package(path_1.default.dirname(packageJsonPath), packageJson);
    }
    catch (_a) {
        return null;
    }
}
exports.getPackageByName = getPackageByName;
/**
 * Resolves to an array of Package instances that represent Expo packages inside given directory.
 */
async function getListOfPackagesAsync() {
    if (!cachedPackages) {
        const paths = await glob_promise_1.default('**/package.json', {
            cwd: PACKAGES_DIR,
            ignore: ['**/example/**', '**/expo-development-client/bundle/**', '**/node_modules/**'],
        });
        cachedPackages = paths.map((packageJsonPath) => {
            const fullPackageJsonPath = path_1.default.join(PACKAGES_DIR, packageJsonPath);
            const packagePath = path_1.default.dirname(fullPackageJsonPath);
            const packageJson = require(fullPackageJsonPath);
            return new Package(packagePath, packageJson);
        });
    }
    return cachedPackages;
}
exports.getListOfPackagesAsync = getListOfPackagesAsync;
function readUnimoduleJsonAtDirectory(dir) {
    const unimoduleJsonPath = path_1.default.join(dir, 'unimodule.json');
    try {
        return require(unimoduleJsonPath);
    }
    catch (error) {
        return null;
    }
}
function pathToLocalPackageJson(packageName) {
    return path_1.default.join(PACKAGES_DIR, packageName, 'package.json');
}
//# sourceMappingURL=Packages.js.map