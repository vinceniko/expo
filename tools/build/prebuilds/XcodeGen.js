"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpecFromPodspecAsync = exports.generateXcodeProjectAsync = exports.INFO_PLIST_FILENAME = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const semver_1 = __importDefault(require("semver"));
const Utils_1 = require("../Utils");
const Constants_1 = require("../Constants");
const PODS_DIR = path_1.default.join(Constants_1.IOS_DIR, 'Pods');
const PODS_PUBLIC_HEADERS_DIR = path_1.default.join(PODS_DIR, 'Headers', 'Public');
const PLATFORMS_MAPPING = {
    ios: 'iOS',
    osx: 'macOS',
    macos: 'macOS',
    tvos: 'tvOS',
    watchos: 'watchOS',
};
exports.INFO_PLIST_FILENAME = 'Info-generated.plist';
/**
 * Generates `.xcodeproj` from given project spec and saves it at given dir.
 */
async function generateXcodeProjectAsync(dir, spec) {
    const specPath = path_1.default.join(dir, `${spec.name}.spec.json`);
    // Save the spec to the file so `xcodegen` can use it.
    await fs_extra_1.default.outputJSON(specPath, spec, {
        spaces: 2,
    });
    // Generate `.xcodeproj` from given spec. The binary is provided by `@expo/xcodegen` package.
    await Utils_1.spawnAsync('yarn', ['--silent', 'run', 'xcodegen', '--quiet', '--spec', specPath], {
        cwd: Constants_1.EXPOTOOLS_DIR,
        stdio: 'inherit',
    });
    // Remove temporary spec file.
    await fs_extra_1.default.remove(specPath);
    return path_1.default.join(dir, `${spec.name}.xcodeproj`);
}
exports.generateXcodeProjectAsync = generateXcodeProjectAsync;
/**
 * Creates `xcodegen` spec from the podspec. It's very naive, but covers all our cases so far.
 */
async function createSpecFromPodspecAsync(podspec, dependencyResolver) {
    var _a, _b;
    const platforms = Object.keys(podspec.platforms);
    const deploymentTarget = platforms.reduce((acc, platform) => {
        acc[PLATFORMS_MAPPING[platform]] = podspec.platforms[platform];
        return acc;
    }, {});
    const dependenciesNames = podspec.dependencies ? Object.keys(podspec.dependencies) : [];
    const dependencies = (await Promise.all(dependenciesNames.map((dependencyName) => dependencyResolver(dependencyName)))).filter(Boolean);
    const bundleId = podNameToBundleId(podspec.name);
    return {
        name: podspec.name,
        targets: {
            [podspec.name]: {
                type: 'framework',
                platform: platforms.map((platform) => PLATFORMS_MAPPING[platform]),
                sources: [
                    {
                        path: '',
                        name: podspec.name,
                        createIntermediateGroups: true,
                        includes: Utils_1.arrayize(podspec.source_files),
                        excludes: [
                            exports.INFO_PLIST_FILENAME,
                            `${podspec.name}.spec.json`,
                            '*.xcodeproj',
                            '*.xcframework',
                            '*.podspec',
                            ...Utils_1.arrayize(podspec.exclude_files),
                        ],
                        compilerFlags: podspec.compiler_flags,
                    },
                ],
                dependencies: [
                    ...Utils_1.arrayize(podspec.frameworks).map((framework) => ({
                        sdk: `${framework}.framework`,
                    })),
                    ...dependencies,
                ],
                settings: {
                    base: mergeXcodeConfigs((_a = podspec.pod_target_xcconfig) !== null && _a !== void 0 ? _a : {}, {
                        MACH_O_TYPE: 'staticlib',
                    }),
                },
                info: {
                    path: exports.INFO_PLIST_FILENAME,
                    properties: mergeXcodeConfigs({
                        CFBundleIdentifier: bundleId,
                        CFBundleName: podspec.name,
                        CFBundleShortVersionString: podspec.version,
                        CFBundleVersion: semver_1.default.major(podspec.version),
                    }, (_b = podspec.info_plist) !== null && _b !== void 0 ? _b : {}),
                },
            },
        },
        options: {
            minimumXcodeGenVersion: '2.18.0',
            deploymentTarget,
        },
        settings: {
            base: {
                PRODUCT_BUNDLE_IDENTIFIER: bundleId,
                IPHONEOS_DEPLOYMENT_TARGET: podspec.platforms.ios,
                FRAMEWORK_SEARCH_PATHS: constructFrameworkSearchPaths(dependencies),
                HEADER_SEARCH_PATHS: constructHeaderSearchPaths(dependenciesNames),
                // Suppresses deprecation warnings coming from frameworks like OpenGLES.
                VALIDATE_WORKSPACE_SKIPPED_SDK_FRAMEWORKS: Utils_1.arrayize(podspec.frameworks).join(' '),
            },
        },
    };
}
exports.createSpecFromPodspecAsync = createSpecFromPodspecAsync;
function constructFrameworkSearchPaths(dependencies) {
    const frameworks = dependencies.filter((dependency) => !!dependency.framework);
    return ('$(inherited) ' + frameworks.map((dependency) => path_1.default.dirname(dependency.framework)).join(' ')).trim();
}
function constructHeaderSearchPaths(dependencies) {
    // A set of pod names to include in header search paths.
    // For simplicity, we add some more (usually transitive) than direct dependencies.
    const podsToSearchForHeaders = new Set([
        // Some pods' have headers at its root level (ZXingObjC and all our modules).
        // Without this we would have to use `#import <ZXingObjC*.h>` instead of `#import <ZXingObjC/ZXingObjC*.h>`
        '',
        ...dependencies,
        'DoubleConversion',
        'React-callinvoker',
        'React-Core',
        'React-cxxreact',
        'React-jsi',
        'React-jsiexecutor',
        'React-jsinspector',
        'Yoga',
        'glog',
    ]);
    // Should we add private headers too?
    return ('$(inherited) ' +
        [...podsToSearchForHeaders]
            .map((podName) => '"' + path_1.default.join(PODS_PUBLIC_HEADERS_DIR, podName) + '"')
            .join(' ')).trim();
}
/**
 * Merges Xcode config from left to right.
 * Values containing `$(inherited)` are properly taken into account.
 */
function mergeXcodeConfigs(...configs) {
    const result = {};
    for (const config of configs) {
        for (const key in config) {
            const value = config[key];
            result[key] = mergeXcodeConfigValue(result[key], value);
        }
    }
    return result;
}
function mergeXcodeConfigValue(prevValue, nextValue) {
    if (prevValue && typeof prevValue === 'string' && prevValue.includes('$(inherited)')) {
        return '$(inherited) ' + (prevValue + ' ' + nextValue).replace(/\\s*$\(inherited\)\s*/g, ' ');
    }
    return nextValue;
}
/**
 * Simple conversion from pod name to framework's bundle identifier.
 */
function podNameToBundleId(podName) {
    return podName
        .replace(/^UM/, 'unimodules')
        .replace(/^EX/, 'expo')
        .replace(/(\_|[^\w\d\.])+/g, '.')
        .replace(/\.*([A-Z]+)/g, (_, p1) => `.${p1.toLowerCase()}`);
}
//# sourceMappingURL=XcodeGen.js.map