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
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const xcode_1 = __importDefault(require("xcode"));
const semver_1 = __importDefault(require("semver"));
const inquirer_1 = __importDefault(require("inquirer"));
const glob_promise_1 = __importDefault(require("glob-promise"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const ncp_1 = __importDefault(require("ncp"));
const Directories = __importStar(require("../Directories"));
const Npm = __importStar(require("../Npm"));
const Constants_1 = require("../Constants");
const Workspace = __importStar(require("../Workspace"));
const IOS_DIR = Directories.getIosDir();
const ANDROID_DIR = Directories.getAndroidDir();
const PACKAGES_DIR = Directories.getPackagesDir();
const BUNDLED_NATIVE_MODULES_PATH = path_1.default.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');
const ReanimatedModifier = async function (moduleConfig, clonedProjectPath) {
    const firstStep = moduleConfig.steps[0];
    const androidMainPathReanimated = path_1.default.join(clonedProjectPath, 'android', 'src', 'main');
    const androidMainPathExpoview = path_1.default.join(ANDROID_DIR, 'expoview', 'src', 'main');
    const JNIOldPackagePrefix = firstStep.sourceAndroidPackage.split('.').join('/');
    const JNINewPackagePrefix = firstStep.targetAndroidPackage.split('.').join('/');
    const replaceHermesByJSC = async () => {
        const nativeProxyPath = path_1.default.join(clonedProjectPath, 'android', 'src', 'main', 'cpp', 'NativeProxy.cpp');
        const runtimeCreatingLineJSC = 'jsc::makeJSCRuntime();';
        const jscImportingLine = '#include <jsi/JSCRuntime.h>';
        const runtimeCreatingLineHermes = 'facebook::hermes::makeHermesRuntime();';
        const hermesImportingLine = '#include <hermes/hermes.h>';
        const content = await fs_extra_1.default.readFile(nativeProxyPath, 'utf8');
        let transformedContent = content.replace(runtimeCreatingLineHermes, runtimeCreatingLineJSC);
        transformedContent = transformedContent.replace(new RegExp(hermesImportingLine, 'g'), jscImportingLine);
        await fs_extra_1.default.writeFile(nativeProxyPath, transformedContent, 'utf8');
    };
    const replaceJNIPackages = async () => {
        const cppPattern = path_1.default.join(androidMainPathReanimated, 'cpp', '**', '*.@(h|cpp)');
        const androidCpp = await glob_promise_1.default(cppPattern);
        for (const file of androidCpp) {
            const content = await fs_extra_1.default.readFile(file, 'utf8');
            const transformedContent = content.split(JNIOldPackagePrefix).join(JNINewPackagePrefix);
            await fs_extra_1.default.writeFile(file, transformedContent, 'utf8');
        }
    };
    const copyCPP = async () => {
        const dirs = ['Common', 'cpp'];
        for (let dir of dirs) {
            await fs_extra_1.default.remove(path_1.default.join(androidMainPathExpoview, dir)); // clean
            // copy
            await new Promise((res, rej) => {
                ncp_1.default(path_1.default.join(androidMainPathReanimated, dir), path_1.default.join(androidMainPathExpoview, dir), { dereference: true }, () => {
                    res();
                });
            });
        }
    };
    const prepareIOSNativeFiles = async () => {
        const patternCommon = path_1.default.join(clonedProjectPath, 'Common', '**', '*.@(h|mm|cpp)');
        const patternNative = path_1.default.join(clonedProjectPath, 'ios', 'native', '**', '*.@(h|mm|cpp)');
        const commonFiles = await glob_promise_1.default(patternCommon);
        const iosOnlyFiles = await glob_promise_1.default(patternNative);
        const files = [...commonFiles, ...iosOnlyFiles];
        for (let file of files) {
            console.log(file);
            const fileName = file.split(path_1.default.sep).slice(-1)[0];
            await fs_extra_1.default.copy(file, path_1.default.join(clonedProjectPath, 'ios', fileName));
        }
        await fs_extra_1.default.remove(path_1.default.join(clonedProjectPath, 'ios', 'native'));
    };
    await replaceHermesByJSC();
    await replaceJNIPackages();
    await copyCPP();
    await prepareIOSNativeFiles();
};
const vendoredModulesConfig = {
    'react-native-gesture-handler': {
        repoUrl: 'https://github.com/software-mansion/react-native-gesture-handler.git',
        installableInManagedApps: true,
        semverPrefix: '~',
        steps: [
            {
                sourceAndroidPath: 'android/lib/src/main/java/com/swmansion/gesturehandler',
                targetAndroidPath: 'modules/api/components/gesturehandler',
                sourceAndroidPackage: 'com.swmansion.gesturehandler',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
            },
            {
                recursive: true,
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/GestureHandler',
                sourceAndroidPath: 'android/src/main/java/com/swmansion/gesturehandler/react',
                targetAndroidPath: 'modules/api/components/gesturehandler/react',
                sourceAndroidPackage: 'com.swmansion.gesturehandler',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
            },
        ],
        warnings: [
            `NOTE: Any files in ${chalk_1.default.magenta('com.facebook.react')} will not be updated -- you'll need to add these to expoview manually!`,
        ],
    },
    'react-native-reanimated': {
        repoUrl: 'https://github.com/software-mansion/react-native-reanimated.git',
        installableInManagedApps: true,
        semverPrefix: '~',
        moduleModifier: ReanimatedModifier,
        steps: [
            {
                recursive: true,
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Reanimated',
                sourceAndroidPath: 'android/src/main/java/com/swmansion/reanimated',
                targetAndroidPath: 'modules/api/reanimated',
                sourceAndroidPackage: 'com.swmansion.reanimated',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.reanimated',
            },
        ],
        warnings: [
            `NOTE: Any files in ${chalk_1.default.magenta('com.facebook.react')} will not be updated -- you'll need to add these to expoview manually!`,
            `NOTE: Some imports have to be changed from ${chalk_1.default.magenta('<>')} form to 
      ${chalk_1.default.magenta('""')}`,
        ],
    },
    'react-native-screens': {
        repoUrl: 'https://github.com/software-mansion/react-native-screens.git',
        installableInManagedApps: true,
        semverPrefix: '~',
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Screens',
                sourceAndroidPath: 'android/src/main/java/com/swmansion/rnscreens',
                targetAndroidPath: 'modules/api/screens',
                sourceAndroidPackage: 'com.swmansion.rnscreens',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.screens',
            },
        ],
    },
    'react-native-appearance': {
        repoUrl: 'https://github.com/expo/react-native-appearance.git',
        installableInManagedApps: true,
        semverPrefix: '~',
        steps: [
            {
                sourceIosPath: 'ios/Appearance',
                targetIosPath: 'Api/Appearance',
                sourceAndroidPath: 'android/src/main/java/io/expo/appearance',
                targetAndroidPath: 'modules/api/appearance/rncappearance',
                sourceAndroidPackage: 'io.expo.appearance',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.appearance.rncappearance',
            },
        ],
    },
    'amazon-cognito-identity-js': {
        repoUrl: 'https://github.com/aws-amplify/amplify-js.git',
        installableInManagedApps: false,
        steps: [
            {
                sourceIosPath: 'packages/amazon-cognito-identity-js/ios',
                targetIosPath: 'Api/Cognito',
                sourceAndroidPath: 'packages/amazon-cognito-identity-js/android/src/main/java/com/amazonaws',
                targetAndroidPath: 'modules/api/cognito',
                sourceAndroidPackage: 'com.amazonaws',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.cognito',
            },
        ],
    },
    'react-native-view-shot': {
        repoUrl: 'https://github.com/gre/react-native-view-shot.git',
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/ViewShot',
                sourceAndroidPath: 'android/src/main/java/fr/greweb/reactnativeviewshot',
                targetAndroidPath: 'modules/api/viewshot',
                sourceAndroidPackage: 'fr.greweb.reactnativeviewshot',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.viewshot',
            },
        ],
    },
    'react-native-branch': {
        repoUrl: 'https://github.com/BranchMetrics/react-native-branch-deep-linking.git',
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: '../../../../packages/expo-branch/ios/EXBranch/RNBranch',
                sourceAndroidPath: 'android/src/main/java/io/branch/rnbranch',
                targetAndroidPath: '../../../../../../../../../packages/expo-branch/android/src/main/java/io/branch/rnbranch',
                sourceAndroidPackage: 'io.branch.rnbranch',
                targetAndroidPackage: 'io.branch.rnbranch',
                recursive: false,
                updatePbxproj: false,
            },
        ],
    },
    'lottie-react-native': {
        repoUrl: 'https://github.com/react-native-community/lottie-react-native.git',
        installableInManagedApps: true,
        steps: [
            {
                iosPrefix: 'LRN',
                sourceIosPath: 'src/ios/LottieReactNative',
                targetIosPath: 'Api/Components/Lottie',
                sourceAndroidPath: 'src/android/src/main/java/com/airbnb/android/react/lottie',
                targetAndroidPath: 'modules/api/components/lottie',
                sourceAndroidPackage: 'com.airbnb.android.react.lottie',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.lottie',
            },
        ],
    },
    'react-native-svg': {
        repoUrl: 'https://github.com/react-native-community/react-native-svg.git',
        installableInManagedApps: true,
        steps: [
            {
                recursive: true,
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/Svg',
                sourceAndroidPath: 'android/src/main/java/com/horcrux/svg',
                targetAndroidPath: 'modules/api/components/svg',
                sourceAndroidPackage: 'com.horcrux.svg',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.svg',
            },
        ],
    },
    'react-native-maps': {
        repoUrl: 'https://github.com/react-native-community/react-native-maps.git',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'lib/ios/AirGoogleMaps',
                targetIosPath: 'Api/Components/GoogleMaps',
            },
            {
                recursive: true,
                sourceIosPath: 'lib/ios/AirMaps',
                targetIosPath: 'Api/Components/Maps',
                sourceAndroidPath: 'lib/android/src/main/java/com/airbnb/android/react/maps',
                targetAndroidPath: 'modules/api/components/maps',
                sourceAndroidPackage: 'com.airbnb.android.react.maps',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maps',
            },
        ],
    },
    '@react-native-community/netinfo': {
        repoUrl: 'https://github.com/react-native-community/react-native-netinfo.git',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/NetInfo',
                sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/netinfo',
                targetAndroidPath: 'modules/api/netinfo',
                sourceAndroidPackage: 'com.reactnativecommunity.netinfo',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.netinfo',
            },
        ],
    },
    'react-native-webview': {
        repoUrl: 'https://github.com/react-native-community/react-native-webview.git',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'apple',
                targetIosPath: 'Api/Components/WebView',
                sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/webview',
                targetAndroidPath: 'modules/api/components/webview',
                sourceAndroidPackage: 'com.reactnativecommunity.webview',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.webview',
            },
        ],
        warnings: [
            chalk_1.default.bold.yellow(`\n${chalk_1.default.green('react-native-webview')} exposes ${chalk_1.default.blue('useSharedPool')} property which has to be handled differently in Expo Client. After upgrading this library, please ensure that proper patch is in place.`),
            chalk_1.default.bold.yellow(`See commit ${chalk_1.default.cyan('https://github.com/expo/expo/commit/3aeb66e33dc391399ea1c90fd166425130d17a12')}.\n`),
        ],
    },
    'react-native-safe-area-context': {
        repoUrl: 'https://github.com/th3rdwave/react-native-safe-area-context',
        steps: [
            {
                sourceIosPath: 'ios/SafeAreaView',
                targetIosPath: 'Api/SafeAreaContext',
                sourceAndroidPath: 'android/src/main/java/com/th3rdwave/safeareacontext',
                targetAndroidPath: 'modules/api/safeareacontext',
                sourceAndroidPackage: 'com.th3rdwave.safeareacontext',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.safeareacontext',
            },
        ],
        warnings: [
            chalk_1.default.bold.yellow(`Last time checked, ${chalk_1.default.green('react-native-safe-area-context')} used ${chalk_1.default.blue('androidx')} which wasn't at that time supported by Expo. Please ensure that the project builds on Android after upgrading or remove this warning.`),
        ],
    },
    '@react-native-community/datetimepicker': {
        repoUrl: 'https://github.com/react-native-community/react-native-datetimepicker.git',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/DateTimePicker',
                sourceAndroidPath: 'android/src/main/java/com/reactcommunity/rndatetimepicker',
                targetAndroidPath: 'modules/api/components/datetimepicker',
                sourceAndroidPackage: 'com.reactcommunity.rndatetimepicker',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.datetimepicker',
            },
        ],
        warnings: [
            `NOTE: In Expo, native Android styles are prefixed with ${chalk_1.default.magenta('ReactAndroid')}. Please ensure that ${chalk_1.default.magenta('resourceName')}s used for grabbing style of dialogs are being resolved properly.`,
        ],
    },
    '@react-native-community/masked-view': {
        repoUrl: 'https://github.com/react-native-community/react-native-masked-view',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/MaskedView',
                sourceAndroidPath: 'android/src/main/java/org/reactnative/maskedview',
                targetAndroidPath: 'modules/api/components/maskedview',
                sourceAndroidPackage: 'org.reactnative.maskedview',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maskedview',
            },
        ],
    },
    '@react-native-community/viewpager': {
        repoUrl: 'https://github.com/react-native-community/react-native-viewpager',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/ViewPager',
                sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/viewpager',
                targetAndroidPath: 'modules/api/components/viewpager',
                sourceAndroidPackage: 'com.reactnativecommunity.viewpager',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.viewpager',
            },
        ],
    },
    'react-native-shared-element': {
        repoUrl: 'https://github.com/IjzerenHein/react-native-shared-element',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/SharedElement',
                sourceAndroidPath: 'android/src/main/java/com/ijzerenhein/sharedelement',
                targetAndroidPath: 'modules/api/components/sharedelement',
                sourceAndroidPackage: 'com.ijzerenhein.sharedelement',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.sharedelement',
            },
        ],
    },
    '@react-native-community/segmented-control': {
        repoUrl: 'https://github.com/react-native-community/segmented-control',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/SegmentedControl',
            },
        ],
    },
    '@react-native-picker/picker': {
        repoUrl: 'https://github.com/react-native-picker/picker',
        installableInManagedApps: true,
        steps: [
            {
                sourceIosPath: 'ios',
                targetIosPath: 'Api/Components/Picker',
                sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/picker',
                targetAndroidPath: 'modules/api/components/picker',
                sourceAndroidPackage: 'com.reactnativecommunity.picker',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.picker',
            },
        ],
    },
    '@react-native-community/slider': {
        repoUrl: 'https://github.com/react-native-community/react-native-slider',
        installableInManagedApps: true,
        packageJsonPath: 'src',
        steps: [
            {
                sourceIosPath: 'src/ios',
                targetIosPath: 'Api/Components/Slider',
                sourceAndroidPath: 'src/android/src/main/java/com/reactnativecommunity/slider',
                targetAndroidPath: 'modules/api/components/slider',
                sourceAndroidPackage: 'com.reactnativecommunity.slider',
                targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.slider',
            },
        ],
    },
};
async function getBundledNativeModulesAsync() {
    return (await json_file_1.default.readAsync(BUNDLED_NATIVE_MODULES_PATH));
}
async function updateBundledNativeModulesAsync(updater) {
    console.log(`\nUpdating ${chalk_1.default.magenta('bundledNativeModules.json')} ...`);
    const jsonFile = new json_file_1.default(BUNDLED_NATIVE_MODULES_PATH);
    const data = await jsonFile.readAsync();
    await jsonFile.writeAsync(await updater(data));
}
async function renameIOSSymbolsAsync(file, iosPrefix) {
    const content = await fs_extra_1.default.readFile(file, 'utf8');
    // Do something more sophisticated if this causes issues with more complex modules.
    const transformedContent = content.replace(new RegExp(iosPrefix, 'g'), 'EX');
    const newFileName = file.replace(iosPrefix, 'EX');
    await fs_extra_1.default.writeFile(newFileName, transformedContent, 'utf8');
    await fs_extra_1.default.remove(file);
}
async function findObjcFilesAsync(dir, recursive) {
    const pattern = path_1.default.join(dir, recursive ? '**' : '', '*.@(h|m|c|mm|cpp|swift)');
    return await glob_promise_1.default(pattern);
}
async function renamePackageAndroidAsync(file, sourceAndroidPackage, targetAndroidPackage) {
    const content = await fs_extra_1.default.readFile(file, 'utf8');
    // Note: this only works for a single package. If react-native-svg separates
    // its code into multiple packages we will have to do something more
    // sophisticated here.
    const transformedContent = content.replace(new RegExp(sourceAndroidPackage, 'g'), targetAndroidPackage);
    await fs_extra_1.default.writeFile(file, transformedContent, 'utf8');
}
async function findAndroidFilesAsync(dir) {
    const pattern = path_1.default.join(dir, '**', '*.@(java|kt)');
    return await glob_promise_1.default(pattern);
}
async function loadXcodeprojFileAsync(file) {
    return new Promise((resolve, reject) => {
        const pbxproj = xcode_1.default.project(file);
        pbxproj.parse((err) => (err ? reject(err) : resolve(pbxproj)));
    });
}
function pbxGroupChild(file) {
    const obj = Object.create(null);
    obj.value = file.fileRef;
    obj.comment = file.basename;
    return obj;
}
function pbxGroupHasChildWithRef(group, ref) {
    return group.children.some((child) => child.value === ref);
}
async function addFileToPbxprojAsync(filePath, targetDir, pbxproj) {
    const fileName = path_1.default.basename(filePath);
    // The parent group of the target directory that should already be created in the project, e.g. `Components` or `Api`.
    const targetGroup = pbxproj.pbxGroupByName(path_1.default.basename(path_1.default.dirname(targetDir)));
    if (!pbxproj.hasFile(fileName)) {
        console.log(`Adding ${chalk_1.default.magenta(fileName)} to pbxproj configuration ...`);
        const fileOptions = {
            // Mute warnings from 3rd party modules.
            compilerFlags: '-w',
        };
        // The group name is mostly just a basename of the path.
        const groupName = path_1.default.basename(path_1.default.dirname(filePath));
        // Add a file to pbxproj tree.
        const file = path_1.default.extname(fileName) === '.h'
            ? pbxproj.addHeaderFile(fileName, fileOptions, groupName)
            : pbxproj.addSourceFile(fileName, fileOptions, groupName);
        // Search for the group where the file should be placed.
        const group = pbxproj.pbxGroupByName(groupName);
        // Our files has `includeInIndex` set to 1, so let's continue doing that.
        file.includeInIndex = 1;
        if (group) {
            // Add a file if it is not there already.
            if (!pbxGroupHasChildWithRef(group, file.fileRef)) {
                group.children.push(pbxGroupChild(file));
            }
        }
        else {
            // Create a pbx group with this file.
            const { uuid } = pbxproj.addPbxGroup([file.path], groupName, groupName);
            // Add newly created group to the parent group.
            if (!pbxGroupHasChildWithRef(targetGroup, uuid)) {
                targetGroup.children.push(pbxGroupChild({ fileRef: uuid, basename: groupName }));
            }
        }
    }
}
async function copyFilesAsync(files, sourceDir, targetDir) {
    for (const file of files) {
        const fileRelativePath = path_1.default.relative(sourceDir, file);
        const fileTargetPath = path_1.default.join(targetDir, fileRelativePath);
        await fs_extra_1.default.mkdirs(path_1.default.dirname(fileTargetPath));
        await fs_extra_1.default.copy(file, fileTargetPath);
        console.log(chalk_1.default.yellow('>'), chalk_1.default.magenta(path_1.default.relative(Constants_1.EXPO_DIR, fileTargetPath)));
    }
}
async function listAvailableVendoredModulesAsync(onlyOutdated = false) {
    const bundledNativeModules = await getBundledNativeModulesAsync();
    const vendoredPackageNames = Object.keys(vendoredModulesConfig);
    const packageViews = await Promise.all(vendoredPackageNames.map((packageName) => Npm.getPackageViewAsync(packageName)));
    for (const packageName of vendoredPackageNames) {
        const packageView = packageViews.shift();
        if (!packageView) {
            console.error(chalk_1.default.red.bold(`Couldn't get package view for ${chalk_1.default.green.bold(packageName)}.\n`));
            continue;
        }
        const moduleConfig = vendoredModulesConfig[packageName];
        const bundledVersion = bundledNativeModules[packageName];
        const latestVersion = packageView.versions[packageView.versions.length - 1];
        if (!onlyOutdated || !bundledVersion || semver_1.default.gtr(latestVersion, bundledVersion)) {
            console.log(chalk_1.default.bold.green(packageName));
            console.log(`${chalk_1.default.yellow('>')} repository     : ${chalk_1.default.magenta(moduleConfig.repoUrl)}`);
            console.log(`${chalk_1.default.yellow('>')} bundled version: ${(bundledVersion ? chalk_1.default.cyan : chalk_1.default.gray)(bundledVersion)}`);
            console.log(`${chalk_1.default.yellow('>')} latest version : ${chalk_1.default.cyan(latestVersion)}`);
            console.log();
        }
    }
}
async function askForModuleAsync() {
    const { moduleName } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'moduleName',
            message: 'Which 3rd party module would you like to update?',
            choices: Object.keys(vendoredModulesConfig),
        },
    ]);
    return moduleName;
}
async function action(options) {
    var _a;
    if (options.list || options.listOutdated) {
        await listAvailableVendoredModulesAsync(options.listOutdated);
        return;
    }
    const moduleName = options.module || (await askForModuleAsync());
    const moduleConfig = vendoredModulesConfig[moduleName];
    if (!moduleConfig) {
        throw new Error(`Module \`${chalk_1.default.green(moduleName)}\` doesn't match any of currently supported 3rd party modules. Run with \`--list\` to show a list of modules.`);
    }
    moduleConfig.installableInManagedApps =
        moduleConfig.installableInManagedApps == null ? true : moduleConfig.installableInManagedApps;
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), moduleName);
    // Cleanup tmp dir.
    await fs_extra_1.default.remove(tmpDir);
    console.log(`Cloning ${chalk_1.default.green(moduleName)}${chalk_1.default.red('#')}${chalk_1.default.cyan(options.commit)} from GitHub ...`);
    // Clone the repository.
    await spawn_async_1.default('git', ['clone', moduleConfig.repoUrl, tmpDir]);
    // Checkout at given commit (defaults to master).
    await spawn_async_1.default('git', ['checkout', options.commit], { cwd: tmpDir });
    if (moduleConfig.warnings) {
        moduleConfig.warnings.forEach((warning) => console.warn(warning));
    }
    if (moduleConfig.moduleModifier) {
        await moduleConfig.moduleModifier(moduleConfig, tmpDir);
    }
    for (const step of moduleConfig.steps) {
        const executeAndroid = ['all', 'android'].includes(options.platform);
        const executeIOS = ['all', 'ios'].includes(options.platform);
        step.recursive = step.recursive === true;
        step.updatePbxproj = !(step.updatePbxproj === false);
        // iOS
        if (executeIOS && step.sourceIosPath && step.targetIosPath) {
            const sourceDir = path_1.default.join(tmpDir, step.sourceIosPath);
            const targetDir = path_1.default.join(IOS_DIR, 'Exponent', 'Versioned', 'Core', step.targetIosPath);
            console.log(`\nCleaning up iOS files at ${chalk_1.default.magenta(path_1.default.relative(IOS_DIR, targetDir))} ...`);
            await fs_extra_1.default.remove(targetDir);
            await fs_extra_1.default.mkdirs(targetDir);
            console.log('\nCopying iOS files ...');
            const objcFiles = await findObjcFilesAsync(sourceDir, step.recursive);
            const pbxprojPath = path_1.default.join(IOS_DIR, 'Exponent.xcodeproj', 'project.pbxproj');
            const pbxproj = await loadXcodeprojFileAsync(pbxprojPath);
            await copyFilesAsync(objcFiles, sourceDir, targetDir);
            if (options.pbxproj && step.updatePbxproj) {
                console.log(`\nUpdating pbxproj configuration ...`);
                for (const file of objcFiles) {
                    const fileRelativePath = path_1.default.relative(sourceDir, file);
                    const fileTargetPath = path_1.default.join(targetDir, fileRelativePath);
                    await addFileToPbxprojAsync(fileTargetPath, targetDir, pbxproj);
                }
                console.log(`Saving updated pbxproj structure to the file ${chalk_1.default.magenta(path_1.default.relative(IOS_DIR, pbxprojPath))} ...`);
                await fs_extra_1.default.writeFile(pbxprojPath, pbxproj.writeSync());
            }
            if (step.iosPrefix) {
                console.log(`\nUpdating classes prefix to ${chalk_1.default.yellow(step.iosPrefix)} ...`);
                const files = await findObjcFilesAsync(targetDir, step.recursive);
                for (const file of files) {
                    await renameIOSSymbolsAsync(file, step.iosPrefix);
                }
            }
            console.log(chalk_1.default.yellow(`\nSuccessfully updated iOS files, but please make sure Xcode project files are setup correctly in ${chalk_1.default.magenta(`Exponent/Versioned/Core/${step.targetIosPath}`)}`));
        }
        // Android
        if (executeAndroid &&
            step.sourceAndroidPath &&
            step.targetAndroidPath &&
            step.sourceAndroidPackage &&
            step.targetAndroidPackage) {
            const sourceDir = path_1.default.join(tmpDir, step.sourceAndroidPath);
            const targetDir = path_1.default.join(ANDROID_DIR, 'expoview', 'src', 'main', 'java', 'versioned', 'host', 'exp', 'exponent', step.targetAndroidPath);
            console.log(`\nCleaning up Android files at ${chalk_1.default.magenta(path_1.default.relative(ANDROID_DIR, targetDir))} ...`);
            await fs_extra_1.default.remove(targetDir);
            await fs_extra_1.default.mkdirs(targetDir);
            console.log('\nCopying Android files ...');
            const javaFiles = await findAndroidFilesAsync(sourceDir);
            await copyFilesAsync(javaFiles, sourceDir, targetDir);
            const files = await findAndroidFilesAsync(targetDir);
            for (const file of files) {
                await renamePackageAndroidAsync(file, step.sourceAndroidPackage, step.targetAndroidPackage);
            }
        }
    }
    const { name, version } = await json_file_1.default.readAsync(path_1.default.join(tmpDir, (_a = moduleConfig.packageJsonPath) !== null && _a !== void 0 ? _a : '', 'package.json'));
    const semverPrefix = (options.semverPrefix != null ? options.semverPrefix : moduleConfig.semverPrefix) || '';
    const versionRange = `${semverPrefix}${version}`;
    await updateBundledNativeModulesAsync(async (bundledNativeModules) => {
        if (moduleConfig.installableInManagedApps) {
            bundledNativeModules[name] = versionRange;
            console.log(`Updated ${chalk_1.default.green(name)} in ${chalk_1.default.magenta('bundledNativeModules.json')} to version range ${chalk_1.default.cyan(versionRange)}`);
        }
        else if (bundledNativeModules[name]) {
            delete bundledNativeModules[name];
            console.log(`Removed non-installable package ${chalk_1.default.green(name)} from ${chalk_1.default.magenta('bundledNativeModules.json')}`);
        }
        return bundledNativeModules;
    });
    console.log(`\nUpdating ${chalk_1.default.green(name)} in workspace projects...`);
    await Workspace.updateDependencyAsync(name, versionRange);
    console.log(`\nRunning \`${chalk_1.default.cyan(`yarn`)}\`...`);
    // We updated dependencies so we need to run yarn.
    await Workspace.installAsync();
    console.log(`\nFinished updating ${chalk_1.default.green(moduleName)}, make sure to update files in the Xcode project (if you updated iOS, see logs above) and test that it still works. 🙂`);
}
exports.default = (program) => {
    program
        .command('update-vendored-module')
        .alias('update-module', 'uvm')
        .description('Updates 3rd party modules.')
        .option('-l, --list', 'Shows a list of available 3rd party modules.', false)
        .option('-o, --list-outdated', 'Shows a list of outdated 3rd party modules.', false)
        .option('-m, --module <string>', 'Name of the module to update.')
        .option('-p, --platform <string>', 'A platform on which the vendored module will be updated.', 'all')
        .option('-c, --commit <string>', 'Git reference on which to checkout when copying 3rd party module.', 'master')
        .option('-s, --semver-prefix <string>', 'Setting this flag forces to use given semver prefix. Some modules may specify them by the config, but in case we want to update to alpha/beta versions we should use an empty prefix to be more strict.', null)
        .option('--no-pbxproj', 'Whether to skip updating project.pbxproj file.', false)
        .asyncAction(action);
};
//# sourceMappingURL=LegacyUpdateVendoredModule.js.map