"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanFrameworksAsync = exports.generateXcodeProjectSpecAsync = exports.cleanTemporaryFilesAsync = exports.buildFrameworksForProjectAsync = exports.prebuildPackageAsync = exports.canPrebuildPackage = exports.PACKAGES_TO_PREBUILD = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const glob_promise_1 = __importDefault(require("glob-promise"));
const Logger_1 = __importDefault(require("../Logger"));
const XcodeProject_1 = __importDefault(require("./XcodeProject"));
const XcodeGen_1 = require("./XcodeGen");
const Constants_1 = require("../Constants");
const PODS_DIR = path_1.default.join(Constants_1.IOS_DIR, 'Pods');
// We will be increasing this list slowly. Once all are enabled,
// find a better way to ignore some packages that shouldn't be prebuilt (like interfaces).
exports.PACKAGES_TO_PREBUILD = [
    '@unimodules/core',
    '@unimodules/react-native-adapter',
    // 'expo-ads-admob',
    // 'expo-ads-facebook',
    // 'expo-analytics-amplitude',
    // 'expo-analytics-segment',
    // 'expo-app-auth',
    // 'expo-apple-authentication',
    // 'expo-application',
    'expo-av',
    // 'expo-background-fetch',
    'expo-barcode-scanner',
    // 'expo-battery',
    // 'expo-blur',
    'expo-branch',
    // 'expo-brightness',
    // 'expo-calendar',
    'expo-camera',
    // 'expo-cellular',
    // 'expo-constants',
    'expo-contacts',
    // 'expo-crypto',
    // 'expo-device',
    // 'expo-document-picker',
    // 'expo-error-recovery',
    'expo-face-detector',
    'expo-facebook',
    'expo-file-system',
    // 'expo-firebase-analytics',
    // 'expo-firebase-core',
    // 'expo-font',
    'expo-gl-cpp',
    'expo-gl',
    'expo-google-sign-in',
    // 'expo-haptics',
    // 'expo-image-loader',
    // 'expo-image-manipulator',
    // 'expo-image-picker',
    // 'expo-keep-awake',
    // 'expo-linear-gradient',
    // 'expo-local-authentication',
    // 'expo-localization',
    'expo-location',
    // 'expo-mail-composer',
    'expo-media-library',
    // 'expo-network',
    'expo-notifications',
    // 'expo-permissions',
    'expo-print',
    // 'expo-screen-capture',
    // 'expo-screen-orientation',
    // 'expo-secure-store',
    'expo-sensors',
    // 'expo-sharing',
    // 'expo-sms',
    // 'expo-speech',
    'expo-splash-screen',
    // 'expo-sqlite',
    // 'expo-store-review',
    'expo-structured-headers',
    // 'expo-task-manager',
    'expo-updates',
];
function canPrebuildPackage(pkg) {
    return exports.PACKAGES_TO_PREBUILD.includes(pkg.packageName);
}
exports.canPrebuildPackage = canPrebuildPackage;
/**
 * Automatically generates `.xcodeproj` from podspec and build frameworks.
 */
async function prebuildPackageAsync(pkg, settings) {
    if (canPrebuildPackage(pkg)) {
        const xcodeProject = await generateXcodeProjectSpecAsync(pkg);
        await buildFrameworksForProjectAsync(xcodeProject, settings);
        await cleanTemporaryFilesAsync(xcodeProject);
    }
}
exports.prebuildPackageAsync = prebuildPackageAsync;
async function buildFrameworksForProjectAsync(xcodeProject, settings) {
    const flavors = [
        {
            configuration: 'Release',
            sdk: 'iphoneos',
            archs: ['arm64'],
        },
        {
            configuration: 'Release',
            sdk: 'iphonesimulator',
            archs: ['x86_64', 'arm64'],
        },
    ];
    // Builds frameworks from flavors.
    const frameworks = [];
    for (const flavor of flavors) {
        Logger_1.default.log('   Building framework for %s', chalk_1.default.yellow(flavor.sdk));
        frameworks.push(await xcodeProject.buildFrameworkAsync(xcodeProject.name, flavor, {
            ONLY_ACTIVE_ARCH: false,
            BITCODE_GENERATION_MODE: 'bitcode',
            BUILD_LIBRARY_FOR_DISTRIBUTION: true,
            DEAD_CODE_STRIPPING: true,
            DEPLOYMENT_POSTPROCESSING: true,
            STRIP_INSTALLED_PRODUCT: true,
            STRIP_STYLE: 'non-global',
            COPY_PHASE_STRIP: true,
            GCC_GENERATE_DEBUGGING_SYMBOLS: false,
            ...settings,
        }));
    }
    // Print binary sizes
    const binarySizes = frameworks.map((framework) => chalk_1.default.magenta((framework.binarySize / 1024 / 1024).toFixed(2) + 'MB'));
    Logger_1.default.log('   Binary sizes:', binarySizes.join(', '));
    Logger_1.default.log('   Merging frameworks to', chalk_1.default.magenta(`${xcodeProject.name}.xcframework`));
    // Merge frameworks into universal xcframework
    await xcodeProject.buildXcframeworkAsync(frameworks, settings);
}
exports.buildFrameworksForProjectAsync = buildFrameworksForProjectAsync;
/**
 * Removes all temporary files that we generated in order to create `.xcframework` file.
 */
async function cleanTemporaryFilesAsync(xcodeProject) {
    Logger_1.default.log('   Cleaning up temporary files');
    const pathsToRemove = [`${xcodeProject.name}.xcodeproj`, XcodeGen_1.INFO_PLIST_FILENAME];
    await Promise.all(pathsToRemove.map((pathToRemove) => fs_extra_1.default.remove(path_1.default.join(xcodeProject.rootDir, pathToRemove))));
}
exports.cleanTemporaryFilesAsync = cleanTemporaryFilesAsync;
/**
 * Generates Xcode project based on the podspec of given package.
 */
async function generateXcodeProjectSpecAsync(pkg) {
    const podspec = await pkg.getPodspecAsync();
    if (!podspec) {
        throw new Error('Given package is not an iOS project.');
    }
    Logger_1.default.log('   Generating Xcode project spec');
    const spec = await XcodeGen_1.createSpecFromPodspecAsync(podspec, async (dependencyName) => {
        const frameworkPath = await findFrameworkForProjectAsync(dependencyName);
        if (frameworkPath) {
            return {
                framework: frameworkPath,
                link: false,
                embed: false,
            };
        }
        return null;
    });
    const xcodeprojPath = await XcodeGen_1.generateXcodeProjectAsync(path_1.default.join(pkg.path, pkg.iosSubdirectory), spec);
    return await XcodeProject_1.default.fromXcodeprojPathAsync(xcodeprojPath);
}
exports.generateXcodeProjectSpecAsync = generateXcodeProjectSpecAsync;
/**
 * Removes prebuilt `.xcframework` files for given packages.
 */
async function cleanFrameworksAsync(packages) {
    for (const pkg of packages) {
        const xcFrameworkFilename = `${pkg.podspecName}.xcframework`;
        const xcFrameworkPath = path_1.default.join(pkg.path, pkg.iosSubdirectory, xcFrameworkFilename);
        if (await fs_extra_1.default.pathExists(xcFrameworkPath)) {
            await fs_extra_1.default.remove(xcFrameworkPath);
        }
    }
}
exports.cleanFrameworksAsync = cleanFrameworksAsync;
/**
 * Checks whether given project name has a framework (GoogleSignIn, FBAudience) and returns its path.
 */
async function findFrameworkForProjectAsync(projectName) {
    const searchNames = new Set([
        projectName,
        projectName.replace(/\/+/, ''),
        projectName.replace(/\/+.*$/, ''),
    ]);
    for (const name of searchNames) {
        const cwd = path_1.default.join(PODS_DIR, name);
        if (await fs_extra_1.default.pathExists(cwd)) {
            const paths = await glob_promise_1.default(`**/*.framework`, {
                cwd,
            });
            if (paths.length > 0) {
                return path_1.default.join(cwd, paths[0]);
            }
        }
    }
    return null;
}
//# sourceMappingURL=Prebuilder.js.map