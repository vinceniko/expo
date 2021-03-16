"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Utils_1 = require("../Utils");
const XcodeGen_1 = require("./XcodeGen");
const Formatter_1 = require("../Formatter");
/**
 * Path to the shared derived data directory.
 */
const SHARED_DERIVED_DATA_DIR = path_1.default.join(os_1.default.tmpdir(), 'Expo/DerivedData');
/**
 * Path to the products in derived data directory. We pick `.framework` files from there.
 */
const PRODUCTS_DIR = path_1.default.join(SHARED_DERIVED_DATA_DIR, 'Build/Products');
/**
 * A class representing single Xcode project and operating on its `.xcodeproj` file.
 */
class XcodeProject {
    constructor(xcodeprojPath) {
        this.name = path_1.default.basename(xcodeprojPath, '.xcodeproj');
        this.rootDir = path_1.default.dirname(xcodeprojPath);
    }
    /**
     * Creates `XcodeProject` instance from given path to `.xcodeproj` file.
     */
    static async fromXcodeprojPathAsync(xcodeprojPath) {
        if (!(await fs_extra_1.default.pathExists(xcodeprojPath))) {
            throw new Error(`Xcodeproj not found at path: ${xcodeprojPath}`);
        }
        return new XcodeProject(xcodeprojPath);
    }
    /**
     * Generates `.xcodeproj` file based on given spec and returns it.
     */
    static async generateProjectFromSpec(dir, spec) {
        const xcodeprojPath = await XcodeGen_1.generateXcodeProjectAsync(dir, spec);
        return new XcodeProject(xcodeprojPath);
    }
    /**
     * Returns output path to where the `.xcframework` file will be stored after running `buildXcframeworkAsync`.
     */
    getXcframeworkPath() {
        return path_1.default.join(this.rootDir, `${this.name}.xcframework`);
    }
    /**
     * Builds `.framework` for given target name and flavor specifying,
     * configuration, the SDK and a list of architectures to compile against.
     */
    async buildFrameworkAsync(target, flavor, options) {
        await this.xcodebuildAsync([
            'build',
            '-project',
            `${this.name}.xcodeproj`,
            '-scheme',
            `${target}_iOS`,
            '-configuration',
            flavor.configuration,
            '-sdk',
            flavor.sdk,
            ...spreadArgs('-arch', flavor.archs),
            '-derivedDataPath',
            SHARED_DERIVED_DATA_DIR,
        ], options);
        const frameworkPath = flavorToFrameworkPath(target, flavor);
        const stat = await fs_extra_1.default.lstat(path_1.default.join(frameworkPath, target));
        // Remove `Headers` as each our module contains headers as part of the provided source code
        // and CocoaPods exposes them through HEADER_SEARCH_PATHS either way.
        await fs_extra_1.default.remove(path_1.default.join(frameworkPath, 'Headers'));
        // `_CodeSignature` is apparently generated only for simulator, afaik we don't need it.
        await fs_extra_1.default.remove(path_1.default.join(frameworkPath, '_CodeSignature'));
        return {
            target,
            flavor,
            frameworkPath,
            binarySize: stat.size,
        };
    }
    /**
     * Builds universal `.xcframework` from given frameworks.
     */
    async buildXcframeworkAsync(frameworks, options) {
        const frameworkPaths = frameworks.map((framework) => framework.frameworkPath);
        const outputPath = this.getXcframeworkPath();
        await fs_extra_1.default.remove(outputPath);
        await this.xcodebuildAsync(['-create-xcframework', ...spreadArgs('-framework', frameworkPaths), '-output', outputPath], options);
        return outputPath;
    }
    /**
     * Removes `.xcframework` artifact produced by `buildXcframeworkAsync`.
     */
    async cleanXcframeworkAsync() {
        await fs_extra_1.default.remove(this.getXcframeworkPath());
    }
    /**
     * Generic function spawning `xcodebuild` process.
     */
    async xcodebuildAsync(args, settings) {
        // `xcodebuild` writes error details to stdout but we don't want to pollute our output if nothing wrong happens.
        // Spawn it quietly, pipe stderr to stdout and pass it to the current process stdout only when it fails.
        const finalArgs = ['-quiet', ...args, '2>&1'];
        if (settings) {
            finalArgs.unshift(...Object.entries(settings).map(([key, value]) => {
                return `${key}=${parseXcodeSettingsValue(value)}`;
            }));
        }
        try {
            await Utils_1.spawnAsync('xcodebuild', finalArgs, {
                cwd: this.rootDir,
                shell: true,
                stdio: ['ignore', 'pipe', 'inherit'],
            });
        }
        catch (e) {
            // Print formatted Xcode logs (merged from stdout and stderr).
            process.stdout.write(Formatter_1.formatXcodeBuildOutput(e.stdout));
            throw e;
        }
    }
    /**
     * Cleans shared derived data directory.
     */
    static async cleanBuildFolderAsync() {
        await fs_extra_1.default.remove(SHARED_DERIVED_DATA_DIR);
    }
}
exports.default = XcodeProject;
/**
 * Returns a path to the prebuilt framework for given flavor.
 */
function flavorToFrameworkPath(target, flavor) {
    return path_1.default.join(PRODUCTS_DIR, `${flavor.configuration}-${flavor.sdk}`, `${target}.framework`);
}
/**
 * Spreads given args under specific flag.
 * Example: `spreadArgs('-arch', ['arm64', 'x86_64'])` returns `['-arch', 'arm64', '-arch', 'x86_64']`
 */
function spreadArgs(argName, args) {
    return [].concat(...args.map((arg) => [argName, arg]));
}
/**
 * Converts boolean values to its Xcode build settings format. Value of other type just passes through.
 */
function parseXcodeSettingsValue(value) {
    if (typeof value === 'boolean') {
        return value ? 'YES' : 'NO';
    }
    return value;
}
//# sourceMappingURL=XcodeProject.js.map