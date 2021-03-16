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
exports.EXCLUDED_PACKAGE_SLUGS = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const Directories = __importStar(require("../Directories"));
const Packages = __importStar(require("../Packages"));
const ProjectVersions = __importStar(require("../ProjectVersions"));
// There are a few packages that we want to exclude from shell app builds; they don't follow any
// easy pattern so we just keep track of them manually here.
exports.EXCLUDED_PACKAGE_SLUGS = [
    'expo-dev-menu',
    'expo-dev-menu-interface',
    'expo-module-template',
    'unimodules-test-core',
];
const EXPO_ROOT_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getAndroidDir();
const REACT_ANDROID_PKG = {
    name: 'ReactAndroid',
    sourceDir: path_1.default.join(ANDROID_DIR, 'ReactAndroid'),
    buildDirRelative: path_1.default.join('com', 'facebook', 'react'),
};
const EXPOVIEW_PKG = {
    name: 'expoview',
    sourceDir: path_1.default.join(ANDROID_DIR, 'expoview'),
    buildDirRelative: path_1.default.join('host', 'exp', 'exponent', 'expoview'),
};
async function _findUnimodules(pkgDir) {
    const unimodules = [];
    const packages = await Packages.getListOfPackagesAsync();
    for (const pkg of packages) {
        if (!pkg.isSupportedOnPlatform('android') || !pkg.androidPackageName)
            continue;
        unimodules.push({
            name: pkg.packageSlug,
            sourceDir: path_1.default.join(pkg.path, pkg.androidSubdirectory),
            buildDirRelative: `${pkg.androidPackageName.replace(/\./g, '/')}/${pkg.packageSlug}`,
        });
    }
    return unimodules;
}
async function _isPackageUpToDate(sourceDir, buildDir) {
    try {
        const sourceCommits = await _gitLogAsync(sourceDir);
        const buildCommits = await _gitLogAsync(buildDir);
        const latestSourceCommitSha = sourceCommits.lines[0].split(' ')[0];
        const latestBuildCommitSha = buildCommits.lines[0].split(' ')[0];
        // throws if source commit is not an ancestor of build commit
        await spawn_async_1.default('git', ['merge-base', '--is-ancestor', latestSourceCommitSha, latestBuildCommitSha], {
            cwd: EXPO_ROOT_DIR,
        });
        return true;
    }
    catch (e) {
        return false;
    }
}
async function _gitLogAsync(path) {
    const child = await spawn_async_1.default('git', ['log', `--pretty=oneline`, '--', path], {
        stdio: 'pipe',
        cwd: EXPO_ROOT_DIR,
    });
    return {
        lines: child.stdout
            .trim()
            .split(/\r?\n/g)
            .filter((a) => a),
    };
}
async function _getSuggestedPackagesToBuild(packages) {
    let packagesToBuild = [];
    for (const pkg of packages) {
        const isUpToDate = await _isPackageUpToDate(pkg.sourceDir, path_1.default.join(EXPO_ROOT_DIR, 'android', 'maven', pkg.buildDirRelative));
        if (!isUpToDate) {
            packagesToBuild.push(pkg.name);
        }
    }
    return packagesToBuild;
}
async function _regexFileAsync(filename, regex, replace) {
    let file = await fs_extra_1.default.readFile(filename);
    let fileString = file.toString();
    await fs_extra_1.default.writeFile(filename, fileString.replace(regex, replace));
}
let savedFiles = {};
async function _stashFilesAsync(filenames) {
    for (const filename of filenames) {
        let file = await fs_extra_1.default.readFile(filename);
        savedFiles[filename] = file.toString();
    }
}
async function _restoreFilesAsync() {
    for (const filename in savedFiles) {
        await fs_extra_1.default.writeFile(filename, savedFiles[filename]);
        delete savedFiles[filename];
    }
}
async function _commentWhenDistributing(filenames) {
    for (const filename of filenames) {
        await _regexFileAsync(filename, /\/\/ WHEN_DISTRIBUTING_REMOVE_FROM_HERE/g, '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE');
        await _regexFileAsync(filename, /\/\ WHEN_DISTRIBUTING_REMOVE_TO_HERE/g, 'WHEN_DISTRIBUTING_REMOVE_TO_HERE */');
    }
}
async function _uncommentWhenDistributing(filenames) {
    for (const filename of filenames) {
        await _regexFileAsync(filename, '/* UNCOMMENT WHEN DISTRIBUTING', '');
        await _regexFileAsync(filename, 'END UNCOMMENT WHEN DISTRIBUTING */', '');
    }
}
async function _updateExpoViewAsync(packages, sdkVersion) {
    let appBuildGradle = path_1.default.join(ANDROID_DIR, 'app', 'build.gradle');
    let rootBuildGradle = path_1.default.join(ANDROID_DIR, 'build.gradle');
    let expoViewBuildGradle = path_1.default.join(ANDROID_DIR, 'expoview', 'build.gradle');
    const settingsGradle = path_1.default.join(ANDROID_DIR, 'settings.gradle');
    const constantsJava = path_1.default.join(ANDROID_DIR, 'expoview/src/main/java/host/exp/exponent/Constants.java');
    const multipleVersionReactNativeActivity = path_1.default.join(ANDROID_DIR, 'expoview/src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java');
    // Modify permanently
    await _regexFileAsync(expoViewBuildGradle, /version = '[\d.]+'/, `version = '${sdkVersion}'`);
    await _regexFileAsync(expoViewBuildGradle, /api 'com.facebook.react:react-native:[\d.]+'/, `api 'com.facebook.react:react-native:${sdkVersion}'`);
    await _regexFileAsync(path_1.default.join(ANDROID_DIR, 'ReactAndroid', 'release.gradle'), /version = '[\d.]+'/, `version = '${sdkVersion}'`);
    await _regexFileAsync(path_1.default.join(ANDROID_DIR, 'app', 'build.gradle'), /host.exp.exponent:expoview:[\d.]+/, `host.exp.exponent:expoview:${sdkVersion}`);
    await _stashFilesAsync([
        appBuildGradle,
        rootBuildGradle,
        expoViewBuildGradle,
        multipleVersionReactNativeActivity,
        constantsJava,
        settingsGradle,
    ]);
    // Modify temporarily
    await _regexFileAsync(constantsJava, /TEMPORARY_ABI_VERSION\s*=\s*null/, `TEMPORARY_ABI_VERSION = "${sdkVersion}"`);
    await _uncommentWhenDistributing([appBuildGradle, expoViewBuildGradle]);
    await _commentWhenDistributing([
        constantsJava,
        rootBuildGradle,
        expoViewBuildGradle,
        multipleVersionReactNativeActivity,
    ]);
    // Clear maven local so that we don't end up with multiple versions
    console.log(' ❌  Clearing old package versions...');
    for (const pkg of packages) {
        await fs_extra_1.default.remove(path_1.default.join(process.env.HOME, '.m2', 'repository', pkg.buildDirRelative));
        await fs_extra_1.default.remove(path_1.default.join(ANDROID_DIR, 'maven', pkg.buildDirRelative));
        await fs_extra_1.default.remove(path_1.default.join(pkg.sourceDir, 'build'));
    }
    // hacky workaround for weird issue where some packages need to be built twice after cleaning
    // in order to have .so libs included in the aar
    const reactAndroidIndex = packages.findIndex(pkg => pkg.name === REACT_ANDROID_PKG.name);
    if (reactAndroidIndex > -1) {
        packages.splice(reactAndroidIndex, 0, REACT_ANDROID_PKG);
    }
    const expoviewIndex = packages.findIndex(pkg => pkg.name === EXPOVIEW_PKG.name);
    if (expoviewIndex > -1) {
        packages.splice(expoviewIndex, 0, EXPOVIEW_PKG);
    }
    let failedPackages = [];
    for (const pkg of packages) {
        process.stdout.write(` 🛠   Building ${pkg.name}...`);
        try {
            await spawn_async_1.default('./gradlew', [`:${pkg.name}:uploadArchives`], {
                cwd: ANDROID_DIR,
            });
            readline_1.default.clearLine(process.stdout, 0);
            readline_1.default.cursorTo(process.stdout, 0);
            process.stdout.write(` ✅  Finished building ${pkg.name}\n`);
        }
        catch (e) {
            if (e.status === 130 ||
                e.signal === 'SIGINT' ||
                e.status === 137 ||
                e.signal === 'SIGKILL' ||
                e.status === 143 ||
                e.signal === 'SIGTERM') {
                throw e;
            }
            else {
                failedPackages.push(pkg.name);
                readline_1.default.clearLine(process.stdout, 0);
                readline_1.default.cursorTo(process.stdout, 0);
                process.stdout.write(` ❌  Failed to build ${pkg.name}:\n`);
                console.error(chalk_1.default.red(e.message));
                console.error(chalk_1.default.red(e.stderr));
            }
        }
    }
    await _restoreFilesAsync();
    console.log(' 🚚  Copying newly built packages...');
    await fs_extra_1.default.mkdirs(path_1.default.join(ANDROID_DIR, 'maven/com/facebook'));
    await fs_extra_1.default.mkdirs(path_1.default.join(ANDROID_DIR, 'maven/host/exp/exponent'));
    await fs_extra_1.default.mkdirs(path_1.default.join(ANDROID_DIR, 'maven/org/unimodules'));
    for (const pkg of packages) {
        if (failedPackages.includes(pkg.name)) {
            continue;
        }
        await fs_extra_1.default.copy(path_1.default.join(process.env.HOME, '.m2', 'repository', pkg.buildDirRelative), path_1.default.join(ANDROID_DIR, 'maven', pkg.buildDirRelative));
    }
    if (failedPackages.length) {
        console.log(' ❌  The following packages failed to build:');
        console.log(failedPackages);
        console.log(`You will need to fix the compilation errors show in the logs above and then run \`et abp -s ${sdkVersion} -p ${failedPackages.join(',')}\``);
    }
    return failedPackages.length;
}
async function action(options) {
    process.on('SIGINT', _exitHandler);
    process.on('SIGTERM', _exitHandler);
    const detachableUniversalModules = (await _findUnimodules(path_1.default.join(EXPO_ROOT_DIR, 'packages'))).filter((unimodule) => !exports.EXCLUDED_PACKAGE_SLUGS.includes(unimodule.name));
    // packages must stay in this order --
    // ReactAndroid MUST be first and expoview MUST be last
    const packages = [REACT_ANDROID_PKG, ...detachableUniversalModules, EXPOVIEW_PKG];
    let packagesToBuild = [];
    const expoviewBuildGradle = await fs_extra_1.default.readFile(path_1.default.join(ANDROID_DIR, 'expoview', 'build.gradle'));
    const match = expoviewBuildGradle
        .toString()
        .match(/api 'com.facebook.react:react-native:([\d.]+)'/);
    if (!match || !match[1]) {
        throw new Error('Could not find SDK version in android/expoview/build.gradle: unexpected format');
    }
    if (match[1] !== options.sdkVersion) {
        console.log(" 🔍  It looks like you're adding a new SDK version. Ignoring the `--packages` option and rebuilding all packages...");
        packagesToBuild = packages.map((pkg) => pkg.name);
    }
    else if (options.packages) {
        if (options.packages === 'all') {
            packagesToBuild = packages.map((pkg) => pkg.name);
        }
        else if (options.packages === 'suggested') {
            console.log(' 🔍  Gathering data about packages...');
            packagesToBuild = await _getSuggestedPackagesToBuild(packages);
        }
        else {
            const packageNames = options.packages.split(',');
            packagesToBuild = packages
                .map((pkg) => pkg.name)
                .filter((pkgName) => packageNames.includes(pkgName));
        }
        console.log(' 🛠   Rebuilding the following packages:');
        console.log(packagesToBuild);
    }
    else {
        // gather suggested package data and then show prompts
        console.log(' 🔍  Gathering data...');
        packagesToBuild = await _getSuggestedPackagesToBuild(packages);
        console.log(' 🕵️   It appears that the following packages need to be rebuilt:');
        console.log(packagesToBuild);
        const { option } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'option',
                message: 'What would you like to do?',
                choices: [
                    { value: 'suggested', name: 'Build the suggested packages only' },
                    { value: 'all', name: 'Build all packages' },
                    { value: 'choose', name: 'Choose packages manually' },
                ],
            },
        ]);
        if (option === 'all') {
            packagesToBuild = packages.map((pkg) => pkg.name);
        }
        else if (option === 'choose') {
            const result = await inquirer_1.default.prompt([
                {
                    type: 'checkbox',
                    name: 'packagesToBuild',
                    message: 'Choose which packages to build',
                    choices: packages.map((pkg) => pkg.name),
                    default: packagesToBuild,
                    pageSize: Math.min(packages.length, (process.stdout.rows || 100) - 2),
                },
            ]);
            packagesToBuild = result.packagesToBuild;
        }
    }
    try {
        const failedPackagesCount = await _updateExpoViewAsync(packages.filter((pkg) => packagesToBuild.includes(pkg.name)), options.sdkVersion);
        if (failedPackagesCount > 0) {
            process.exitCode = 1;
        }
    }
    catch (e) {
        await _exitHandler();
        throw e;
    }
}
async function _exitHandler() {
    if (Object.keys(savedFiles).length) {
        console.log('Exited early, cleaning up...');
        await _restoreFilesAsync();
    }
}
exports.default = (program) => {
    program
        .command('android-build-packages')
        .alias('abp')
        .description('Builds all Android AAR packages for Turtle')
        .option('-s, --sdkVersion [string]', '[optional] SDK version')
        .option('-p, --packages [string]', '[optional] packages to build. May be `all`, `suggested`, or a comma-separate list of package names.')
        .asyncAction(async (options) => {
        var _a;
        const sdkVersion = (_a = options.sdkVersion) !== null && _a !== void 0 ? _a : (await ProjectVersions.getNewestSDKVersionAsync('android'));
        if (!sdkVersion) {
            throw new Error('Could not infer SDK version, please run with `--sdkVersion SDK_VERSION`');
        }
        await action({ ...options, sdkVersion });
    });
};
//# sourceMappingURL=AndroidBuildPackages.js.map