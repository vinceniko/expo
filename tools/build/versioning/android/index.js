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
exports.addVersionAsync = exports.removeVersionAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_promise_1 = __importDefault(require("glob-promise"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const libraries_1 = require("./libraries");
const Directories = __importStar(require("../../Directories"));
const Packages_1 = require("../../Packages");
const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getAndroidDir();
const EXPOTOOLS_DIR = Directories.getExpotoolsDir();
const SCRIPT_DIR = path_1.default.join(EXPOTOOLS_DIR, 'src/versioning/android');
const appPath = path_1.default.join(ANDROID_DIR, 'app');
const expoviewPath = path_1.default.join(ANDROID_DIR, 'expoview');
const versionedAbisPath = path_1.default.join(ANDROID_DIR, 'versioned-abis');
const versionedExpoviewAbiPath = (abiName) => path_1.default.join(versionedAbisPath, `expoview-${abiName}`);
const expoviewBuildGradlePath = path_1.default.join(expoviewPath, 'build.gradle');
const appManifestPath = path_1.default.join(appPath, 'src', 'main', 'AndroidManifest.xml');
const templateManifestPath = path_1.default.join(EXPO_DIR, 'template-files', 'android', 'AndroidManifest.xml');
const settingsGradlePath = path_1.default.join(ANDROID_DIR, 'settings.gradle');
const appBuildGradlePath = path_1.default.join(appPath, 'build.gradle');
const buildGradlePath = path_1.default.join(ANDROID_DIR, 'build.gradle');
const sdkVersionsPath = path_1.default.join(ANDROID_DIR, 'sdkVersions.json');
const rnActivityPath = path_1.default.join(expoviewPath, 'src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java');
const expoviewConstantsPath = path_1.default.join(expoviewPath, 'src/main/java/host/exp/exponent/Constants.java');
const testSuiteTestsPath = path_1.default.join(appPath, 'src/androidTest/java/host/exp/exponent/TestSuiteTests.java');
const reactAndroidPath = path_1.default.join(ANDROID_DIR, 'ReactAndroid');
const reactCommonPath = path_1.default.join(ANDROID_DIR, 'ReactCommon');
const versionedReactAndroidPath = path_1.default.join(ANDROID_DIR, 'versioned-react-native/ReactAndroid');
const versionedReactAndroidJniPath = path_1.default.join(versionedReactAndroidPath, 'src/main');
const versionedReactAndroidJavaPath = path_1.default.join(versionedReactAndroidJniPath, 'java');
const versionedReactCommonPath = path_1.default.join(ANDROID_DIR, 'versioned-react-native/ReactCommon');
async function transformFileAsync(filePath, regexp, replacement = '') {
    const fileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    await fs_extra_1.default.writeFile(filePath, fileContent.replace(regexp, replacement));
}
async function removeVersionReferencesFromFileAsync(sdkMajorVersion, filePath) {
    console.log(`Removing code surrounded by ${chalk_1.default.gray(`// BEGIN_SDK_${sdkMajorVersion}`)} and ${chalk_1.default.gray(`// END_SDK_${sdkMajorVersion}`)} from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, filePath))}...`);
    await transformFileAsync(filePath, new RegExp(`\\s*//\\s*BEGIN_SDK_${sdkMajorVersion}(_\d+)*\\n.*?//\\s*END_SDK_${sdkMajorVersion}(_\d+)*`, 'gs'), '');
}
async function removeVersionedExpoviewAsync(versionedExpoviewAbiPath) {
    console.log(`Removing versioned expoview at ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, versionedExpoviewAbiPath))}...`);
    await fs_extra_1.default.remove(versionedExpoviewAbiPath);
}
async function removeFromManifestAsync(sdkMajorVersion, manifestPath) {
    console.log(`Removing code surrounded by ${chalk_1.default.gray(`<!-- BEGIN_SDK_${sdkMajorVersion} -->`)} and ${chalk_1.default.gray(`<!-- END_SDK_${sdkMajorVersion} -->`)} from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, manifestPath))}...`);
    await transformFileAsync(manifestPath, new RegExp(`\\s*<!--\\s*BEGIN_SDK_${sdkMajorVersion}(_\d+)*\\s*-->.*?<!--\\s*END_SDK_${sdkMajorVersion}(_\d+)*\\s*-->`, 'gs'), '');
}
async function removeFromSettingsGradleAsync(abiName, settingsGradlePath) {
    console.log(`Removing ${chalk_1.default.green(`expoview-${abiName}`)} from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, settingsGradlePath))}...`);
    await transformFileAsync(settingsGradlePath, new RegExp(`\\n\\s*"${abiName}",[^\\n]*`, 'g'), '');
}
async function removeFromBuildGradleAsync(abiName, buildGradlePath) {
    console.log(`Removing maven repository for ${chalk_1.default.green(`expoview-${abiName}`)} from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, buildGradlePath))}...`);
    await transformFileAsync(buildGradlePath, new RegExp(`\\s*maven\\s*{\\s*url\\s*".*?/expoview-${abiName}/maven"\\s*}[^\\n]*`), '');
}
async function removeFromSdkVersionsAsync(version, sdkVersionsPath) {
    console.log(`Removing ${chalk_1.default.cyan(version)} from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, sdkVersionsPath))}...`);
    await transformFileAsync(sdkVersionsPath, new RegExp(`"${version}",\s*`, 'g'), '');
}
async function removeTestSuiteTestsAsync(version, testsFilePath) {
    console.log(`Removing test-suite tests from ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, testsFilePath))}...`);
    await transformFileAsync(testsFilePath, new RegExp(`\\s*(@\\w+\\s+)*@ExpoSdkVersionTest\\("${version}"\\)[^}]+}`), '');
}
async function findAndPrintVersionReferencesInSourceFilesAsync(version) {
    const pattern = new RegExp(`(${version.replace(/\./g, '[._]')}|(SDK|ABI).?${semver_1.default.major(version)})`, 'ig');
    let matchesCount = 0;
    const files = await glob_promise_1.default('**/{src/**/*.@(java|kt|xml),build.gradle}', { cwd: ANDROID_DIR });
    for (const file of files) {
        const filePath = path_1.default.join(ANDROID_DIR, file);
        const fileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
        const fileLines = fileContent.split(/\r\n?|\n/g);
        let match;
        while ((match = pattern.exec(fileContent)) != null) {
            const index = pattern.lastIndex - match[0].length;
            const lineNumberWithMatch = fileContent.substring(0, index).split(/\r\n?|\n/g).length - 1;
            const firstLineInContext = Math.max(0, lineNumberWithMatch - 2);
            const lastLineInContext = Math.min(lineNumberWithMatch + 2, fileLines.length);
            ++matchesCount;
            console.log(`Found ${chalk_1.default.bold.green(match[0])} in ${chalk_1.default.magenta(path_1.default.relative(EXPO_DIR, filePath))}:`);
            for (let lineIndex = firstLineInContext; lineIndex <= lastLineInContext; lineIndex++) {
                console.log(`${chalk_1.default.gray(1 + lineIndex + ':')} ${fileLines[lineIndex].replace(match[0], chalk_1.default.bgMagenta(match[0]))}`);
            }
            console.log();
        }
    }
    return matchesCount > 0;
}
async function removeVersionAsync(version) {
    const abiName = `abi${version.replace(/\./g, '_')}`;
    const sdkMajorVersion = `${semver_1.default.major(version)}`;
    console.log(`Removing SDK version ${chalk_1.default.cyan(version)} for ${chalk_1.default.blue('Android')}...`);
    // Remove expoview-abi*_0_0 library
    await removeVersionedExpoviewAsync(versionedExpoviewAbiPath(abiName));
    await removeFromSettingsGradleAsync(abiName, settingsGradlePath);
    await removeFromBuildGradleAsync(abiName, buildGradlePath);
    // Remove code surrounded by BEGIN_SDK_* and END_SDK_*
    await removeVersionReferencesFromFileAsync(sdkMajorVersion, expoviewBuildGradlePath);
    await removeVersionReferencesFromFileAsync(sdkMajorVersion, appBuildGradlePath);
    await removeVersionReferencesFromFileAsync(sdkMajorVersion, rnActivityPath);
    await removeVersionReferencesFromFileAsync(sdkMajorVersion, expoviewConstantsPath);
    // Remove test-suite tests from the app.
    await removeTestSuiteTestsAsync(version, testSuiteTestsPath);
    // Update AndroidManifests
    await removeFromManifestAsync(sdkMajorVersion, appManifestPath);
    await removeFromManifestAsync(sdkMajorVersion, templateManifestPath);
    // Remove SDK version from the list of supported SDKs
    await removeFromSdkVersionsAsync(version, sdkVersionsPath);
    console.log(`\nLooking for SDK references in source files...`);
    if (await findAndPrintVersionReferencesInSourceFilesAsync(version)) {
        console.log(chalk_1.default.yellow(`Please review all of these references and remove them manually if possible!\n`));
    }
}
exports.removeVersionAsync = removeVersionAsync;
function renameLib(lib, abiVersion) {
    for (let i = 0; i < libraries_1.JniLibNames.length; i++) {
        if (lib.endsWith(libraries_1.JniLibNames[i])) {
            return `${lib}_abi${abiVersion}`;
        }
    }
    return lib;
}
function processLine(line, abiVersion) {
    if (line.startsWith('LOCAL_MODULE') ||
        line.startsWith('LOCAL_SHARED_LIBRARIES') ||
        line.startsWith('LOCAL_STATIC_LIBRARIES')) {
        let splitLine = line.split('=');
        let libs = splitLine[1].split(' ');
        for (let i = 0; i < libs.length; i++) {
            libs[i] = renameLib(libs[i], abiVersion);
        }
        splitLine[1] = libs.join(' ');
        line = splitLine.join('=');
    }
    return line;
}
async function processMkFileAsync(filename, abiVersion) {
    let file = await fs_extra_1.default.readFile(filename);
    let fileString = file.toString();
    await fs_extra_1.default.truncate(filename, 0);
    let lines = fileString.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        line = processLine(line, abiVersion);
        await fs_extra_1.default.appendFile(filename, `${line}\n`);
    }
}
async function processJavaCodeAsync(libName, abiVersion) {
    const abiName = `abi${abiVersion}`;
    return spawn_async_1.default(`find ${versionedReactAndroidJavaPath} ${versionedExpoviewAbiPath(abiName)} -iname '*.java' -type f -print0 | ` +
        `xargs -0 sed -i '' 's/"${libName}"/"${libName}_abi${abiVersion}"/g'`, [], { shell: true });
}
async function updateVersionedReactNativeAsync() {
    await fs_extra_1.default.remove(versionedReactAndroidPath);
    await fs_extra_1.default.remove(versionedReactCommonPath);
    await fs_extra_1.default.copy(reactAndroidPath, versionedReactAndroidPath);
    await fs_extra_1.default.copy(reactCommonPath, versionedReactCommonPath);
}
async function renameJniLibsAsync(version) {
    const abiVersion = version.replace(/\./g, '_');
    const abiPrefix = `abi${abiVersion}`;
    const versionedAbiPath = path_1.default.join(Directories.getAndroidDir(), 'versioned-abis', `expoview-${abiPrefix}`);
    // Update JNI methods
    const packagesToRename = await libraries_1.getJavaPackagesToRename();
    for (const javaPackage of packagesToRename) {
        const pathForPackage = javaPackage.replace(/\./g, '\\/');
        await spawn_async_1.default(`find ${versionedReactCommonPath} ${versionedReactAndroidJniPath} -type f ` +
            `\\( -name \*.java -o -name \*.h -o -name \*.cpp -o -name \*.mk \\) -print0 | ` +
            `xargs -0 sed -i '' 's/${pathForPackage}/abi${abiVersion}\\/${pathForPackage}/g'`, [], { shell: true });
        // reanimated
        const oldJNIReanimatedPackage = 'versioned\\/host\\/exp\\/exponent\\/modules\\/api\\/reanimated\\/';
        const newJNIReanimatedPackage = 'host\\/exp\\/exponent\\/modules\\/api\\/reanimated\\/';
        await spawn_async_1.default(`find ${versionedAbiPath} -type f ` +
            `\\( -name \*.java -o -name \*.h -o -name \*.cpp -o -name \*.mk \\) -print0 | ` +
            `xargs -0 sed -i '' 's/${oldJNIReanimatedPackage}/abi${abiVersion}\\/${newJNIReanimatedPackage}/g'`, [], { shell: true });
    }
    // Update LOCAL_MODULE, LOCAL_SHARED_LIBRARIES, LOCAL_STATIC_LIBRARIES fields in .mk files
    let [reactCommonMkFiles, reactAndroidMkFiles, reanimatedMKFiles] = await Promise.all([
        glob_promise_1.default(path_1.default.join(versionedReactCommonPath, '**/*.mk')),
        glob_promise_1.default(path_1.default.join(versionedReactAndroidJniPath, '**/*.mk')),
        glob_promise_1.default(path_1.default.join(versionedAbiPath, '**/*.mk')),
    ]);
    let filenames = [...reactCommonMkFiles, ...reactAndroidMkFiles, ...reanimatedMKFiles];
    await Promise.all(filenames.map((filename) => processMkFileAsync(filename, abiVersion)));
    // Rename references to JNI libs in Java code
    for (let i = 0; i < libraries_1.JniLibNames.length; i++) {
        let libName = libraries_1.JniLibNames[i];
        await processJavaCodeAsync(libName, abiVersion);
    }
    // 'fbjni' is loaded without the 'lib' prefix in com.facebook.jni.Prerequisites
    await processJavaCodeAsync('fbjni', abiVersion);
    await processJavaCodeAsync('fb', abiVersion);
    console.log('\nThese are the JNI lib names we modified:');
    await spawn_async_1.default(`find ${versionedReactAndroidJavaPath} ${versionedAbiPath} -name "*.java" | xargs grep -i "_abi${abiVersion}"`, [], { shell: true, stdio: 'inherit' });
    console.log('\nAnd here are all instances of loadLibrary:');
    await spawn_async_1.default(`find ${versionedReactAndroidJavaPath} ${versionedAbiPath} -name "*.java" | xargs grep -i "loadLibrary"`, [], { shell: true, stdio: 'inherit' });
    const { isCorrect } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'isCorrect',
            message: 'Does all that look correct?',
            default: false,
        },
    ]);
    if (!isCorrect) {
        throw new Error('Fix JNI libs');
    }
}
async function copyUnimodulesAsync(version) {
    const packages = await Packages_1.getListOfPackagesAsync();
    for (const pkg of packages) {
        if (pkg.isSupportedOnPlatform('android') &&
            pkg.isIncludedInExpoClientOnPlatform('android') &&
            pkg.isVersionableOnPlatform('android')) {
            await spawn_async_1.default('./android-copy-unimodule.sh', [version, path_1.default.join(pkg.path, pkg.androidSubdirectory)], {
                shell: true,
                cwd: SCRIPT_DIR,
            });
            console.log(`   ✅  Created versioned ${pkg.packageName}`);
        }
    }
}
async function addVersionedActivitesToManifests(version) {
    const abiVersion = version.replace(/\./g, '_');
    const abiName = `abi${abiVersion}`;
    const majorVersion = semver_1.default.major(version);
    await transformFileAsync(templateManifestPath, new RegExp('<!-- ADD DEV SETTINGS HERE -->'), `<!-- ADD DEV SETTINGS HERE -->
    <!-- BEGIN_SDK_${majorVersion} -->
    <activity android:name="${abiName}.com.facebook.react.devsupport.DevSettingsActivity"/>
    <!-- END_SDK_${majorVersion} -->`);
    await transformFileAsync(templateManifestPath, new RegExp('<!-- Versioned Activity for Stripe -->'), `<!-- Versioned Activity for Stripe -->
    <!-- BEGIN_SDK_${majorVersion} -->
    <activity
      android:exported="true"
      android:launchMode="singleTask"
      android:name="${abiName}.expo.modules.payments.stripe.RedirectUriReceiver"
      android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen">
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="${abiName}.expo.modules.payments.stripe" />
      </intent-filter>
    </activity>
    <!-- END_SDK_${majorVersion} -->`);
}
async function registerNewVersionUnderSdkVersions(version) {
    let fileString = await fs_extra_1.default.readFile(sdkVersionsPath, 'utf8');
    let jsConfig;
    // read the existing json config and add the new version to the sdkVersions array
    try {
        jsConfig = JSON.parse(fileString);
    }
    catch (e) {
        console.log('Error parsing existing sdkVersions.json file, writing a new one...', e);
        console.log('The erroneous file contents was:', fileString);
        jsConfig = {
            sdkVersions: [],
        };
    }
    // apply changes
    jsConfig.sdkVersions.push(version);
    await fs_extra_1.default.writeFile(sdkVersionsPath, JSON.stringify(jsConfig));
}
async function cleanUpAsync(version) {
    const abiVersion = version.replace(/\./g, '_');
    const abiName = `abi${abiVersion}`;
    const versionedAbiSrcPath = path_1.default.join(versionedExpoviewAbiPath(abiName), 'src/main/java', abiName);
    let filesToDelete = [];
    // delete PrintDocumentAdapter*Callback.java
    // their package is `android.print` and therefore they are not changed by the versioning script
    // so we will have duplicate classes
    const printCallbackFiles = await glob_promise_1.default(path_1.default.join(versionedAbiSrcPath, 'expo/modules/print/*Callback.java'));
    for (const file of printCallbackFiles) {
        const contents = await fs_extra_1.default.readFile(file, 'utf8');
        if (!contents.includes(`package ${abiName}`)) {
            filesToDelete.push(file);
        }
        else {
            console.log(`Skipping deleting ${file} because it appears to have been versioned`);
        }
    }
    // delete versioned loader providers since we don't need them
    filesToDelete.push(path_1.default.join(versionedAbiSrcPath, 'expo/loaders'));
    console.log('Deleting the following files and directories:');
    console.log(filesToDelete);
    for (const file of filesToDelete) {
        await fs_extra_1.default.remove(file);
    }
    // misc fixes for versioned code
    const versionedExponentPackagePath = path_1.default.join(versionedAbiSrcPath, 'host/exp/exponent/ExponentPackage.java');
    await transformFileAsync(versionedExponentPackagePath, new RegExp('// WHEN_VERSIONING_REMOVE_FROM_HERE', 'g'), '/* WHEN_VERSIONING_REMOVE_FROM_HERE');
    await transformFileAsync(versionedExponentPackagePath, new RegExp('// WHEN_VERSIONING_REMOVE_TO_HERE', 'g'), 'WHEN_VERSIONING_REMOVE_TO_HERE */');
    await transformFileAsync(path_1.default.join(versionedAbiSrcPath, 'host/exp/exponent/VersionedUtils.java'), new RegExp('// DO NOT EDIT THIS COMMENT - used by versioning scripts[^,]+,[^,]+,'), 'null, null,');
    await transformFileAsync(path_1.default.join(versionedAbiSrcPath, 'expo/modules/payments/stripe/PayFlow.java'), new RegExp('// ADD BUILDCONFIG IMPORT HERE'), `import ${abiName}.host.exp.expoview.BuildConfig;`);
    // replace abixx_x_x...R with abixx_x_x.host.exp.expoview.R
    await spawn_async_1.default(`find ${versionedAbiSrcPath} -iname '*.java' -type f -print0 | ` +
        `xargs -0 sed -i '' 's/import ${abiName}\.[^;]*\.R;/import ${abiName}.host.exp.expoview.R;/g'`, [], { shell: true });
    await spawn_async_1.default(`find ${versionedAbiSrcPath} -iname '*.kt' -type f -print0 | ` +
        `xargs -0 sed -i '' 's/import ${abiName}\\..*\\.R$/import ${abiName}.host.exp.expoview.R/g'`, [], { shell: true });
    // add new versioned maven to build.gradle
    await transformFileAsync(buildGradlePath, new RegExp('// For old expoviews to work'), `// For old expoviews to work
    maven {
      url "$rootDir/versioned-abis/expoview-${abiName}/maven"
    }`);
}
async function prepareReanimatedAsync(version) {
    const abiVersion = version.replace(/\./g, '_');
    const abiName = `abi${abiVersion}`;
    const versionedExpoviewPath = versionedExpoviewAbiPath(abiName);
    const buildReanimatedSO = async () => {
        await spawn_async_1.default(`./gradlew :expoview-${abiName}:packageNdkLibs`, [], {
            shell: true,
            cwd: path_1.default.join(versionedExpoviewPath, '../../'),
            stdio: 'inherit',
        });
    };
    const removeLeftoverDirectories = async () => {
        const mainPath = path_1.default.join(versionedExpoviewPath, 'src', 'main');
        const toRemove = ['Common', 'JNI', 'cpp'];
        for (let dir of toRemove) {
            await fs_extra_1.default.remove(path_1.default.join(mainPath, dir));
        }
    };
    const removeLeftoversFromGradle = async () => {
        await spawn_async_1.default('./android-remove-reanimated-code-from-gradle.sh', [version], {
            shell: true,
            cwd: SCRIPT_DIR,
            stdio: 'inherit',
        });
    };
    await buildReanimatedSO();
    await removeLeftoverDirectories();
    await removeLeftoversFromGradle();
}
async function addVersionAsync(version) {
    console.log(' 🛠   1/9: Updating android/versioned-react-native...');
    await updateVersionedReactNativeAsync();
    console.log(' ✅  1/9: Finished\n\n');
    console.log(' 🛠   2/9: Creating versioned expoview package...');
    await spawn_async_1.default('./android-copy-expoview.sh', [version], {
        shell: true,
        cwd: SCRIPT_DIR,
    });
    console.log(' ✅  2/9: Finished\n\n');
    console.log(' 🛠   3/9: Renaming JNI libs in android/versioned-react-native and Reanimated...');
    await renameJniLibsAsync(version);
    console.log(' ✅  3/9: Finished\n\n');
    console.log(' 🛠   4/9: prepare versioned Reanimated...');
    await prepareReanimatedAsync(version);
    console.log(' ✅  4/9: Finished\n\n');
    console.log(' 🛠   5/9: Building versioned ReactAndroid AAR...');
    await spawn_async_1.default('./android-build-aar.sh', [version], {
        shell: true,
        cwd: SCRIPT_DIR,
        stdio: 'inherit',
    });
    console.log(' ✅  5/9: Finished\n\n');
    console.log(' 🛠   6/9: Creating versioned unimodule packages...');
    await copyUnimodulesAsync(version);
    console.log(' ✅  6/9: Finished\n\n');
    console.log(' 🛠   7/9: Adding extra versioned activites to AndroidManifest...');
    await addVersionedActivitesToManifests(version);
    console.log(' ✅  7/9: Finished\n\n');
    console.log(' 🛠   8/9: Registering new version under sdkVersions config...');
    await registerNewVersionUnderSdkVersions(version);
    console.log(' ✅  8/9: Finished\n\n');
    console.log(' 🛠   9/9: Misc cleanup...');
    await cleanUpAsync(version);
    console.log(' ✅  9/9: Finished');
}
exports.addVersionAsync = addVersionAsync;
//# sourceMappingURL=index.js.map