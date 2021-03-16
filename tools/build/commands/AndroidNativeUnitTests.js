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
exports.androidNativeUnitTests = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const Utils_1 = require("../Utils");
const Directories = __importStar(require("../Directories"));
const Packages = __importStar(require("../Packages"));
const ANDROID_DIR = Directories.getAndroidDir();
const excludedInTests = [
    'expo-module-template',
    'expo-notifications',
    'expo-in-app-purchases',
    'expo-splash-screen',
    'unimodules-test-core',
];
async function androidNativeUnitTests({ type }) {
    if (!type) {
        throw new Error('Must specify which type of unit test to run with `--type local` or `--type instrumented`.');
    }
    if (type !== 'local' && type !== 'instrumented') {
        throw new Error('Invalid type specified. Must use `--type local` or `--type instrumented`.');
    }
    const packages = await Packages.getListOfPackagesAsync();
    function consoleErrorOutput(output, label, colorifyLine) {
        const lines = output.trim().split(/\r\n?|\n/g);
        console.error(lines.map((line) => `${chalk_1.default.gray(label)} ${colorifyLine(line)}`).join('\n'));
    }
    const androidPackages = await Utils_1.filterAsync(packages, async (pkg) => {
        const pkgSlug = pkg.packageSlug;
        if (type === 'instrumented') {
            return (pkg.isSupportedOnPlatform('android') &&
                (await pkg.hasNativeInstrumentationTestsAsync('android')) &&
                !excludedInTests.includes(pkgSlug));
        }
        else {
            return (pkg.isSupportedOnPlatform('android') &&
                (await pkg.hasNativeTestsAsync('android')) &&
                !excludedInTests.includes(pkgSlug));
        }
    });
    console.log(chalk_1.default.green('Packages to test: '));
    androidPackages.forEach((pkg) => {
        console.log(chalk_1.default.yellow(pkg.packageSlug));
    });
    const testCommand = type === 'instrumented' ? 'connectedAndroidTest' : 'test';
    try {
        await spawn_async_1.default('./gradlew', androidPackages.map((pkg) => `:${pkg.packageSlug}:${testCommand}`), {
            cwd: ANDROID_DIR,
            stdio: 'inherit',
            env: { ...process.env },
        });
    }
    catch (error) {
        console.error('Failed while executing android unit tests');
        consoleErrorOutput(error.stdout, 'stdout >', chalk_1.default.reset);
        consoleErrorOutput(error.stderr, 'stderr >', chalk_1.default.red);
        throw error;
    }
    console.log(chalk_1.default.green('Finished android unit tests successfully.'));
    return;
}
exports.androidNativeUnitTests = androidNativeUnitTests;
exports.default = (program) => {
    program
        .command('android-native-unit-tests')
        .option('-t, --type <string>', 'Type of unit test to run: local or instrumented')
        .description('Runs Android native unit tests for each package that provides them.')
        .asyncAction(androidNativeUnitTests);
};
//# sourceMappingURL=AndroidNativeUnitTests.js.map