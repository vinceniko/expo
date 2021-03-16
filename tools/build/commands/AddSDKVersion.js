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
const chalk_1 = __importDefault(require("chalk"));
const semver_1 = __importDefault(require("semver"));
const inquirer_1 = __importDefault(require("inquirer"));
const AndroidVersioning = __importStar(require("../versioning/android"));
const IosVersioning = __importStar(require("../versioning/ios"));
const ProjectVersions_1 = require("../ProjectVersions");
async function getNextOrAskForSDKVersionAsync(platform) {
    const defaultSdkVersion = await ProjectVersions_1.getNextSDKVersionAsync(platform);
    if (defaultSdkVersion && process.env.CI) {
        console.log(`${chalk_1.default.red('`--sdkVersion`')} not provided - defaulting to ${chalk_1.default.cyan(defaultSdkVersion)}`);
        return defaultSdkVersion;
    }
    const { sdkVersion } = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'sdkVersion',
            message: 'What is the SDK version that you want to add?',
            default: defaultSdkVersion,
            validate(value) {
                if (!semver_1.default.valid(value)) {
                    return `Invalid version: ${chalk_1.default.cyan(value)}`;
                }
                return true;
            },
        },
    ]);
    return sdkVersion;
}
async function action(options) {
    if (!options.platform) {
        throw new Error('Run with `--platform <ios | android>`.');
    }
    const sdkVersion = options.sdkVersion || (await getNextOrAskForSDKVersionAsync(options.platform));
    if (!sdkVersion) {
        throw new Error('Next SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
    }
    const sdkNumber = semver_1.default.major(sdkVersion);
    switch (options.platform) {
        case 'ios':
            if (options.vendored.length > 0) {
                await IosVersioning.versionVendoredModulesAsync(sdkNumber, options.vendored);
            }
            else if (options.filenames) {
                await IosVersioning.versionReactNativeIOSFilesAsync(options.filenames, sdkVersion);
            }
            else {
                await IosVersioning.versionVendoredModulesAsync(sdkNumber, null);
                await IosVersioning.addVersionAsync(sdkVersion);
            }
            await IosVersioning.reinstallPodsAsync(options.reinstall);
            return;
        case 'android':
            return AndroidVersioning.addVersionAsync(sdkVersion);
        default:
            throw new Error(`Platform '${options.platform}' is not supported.`);
    }
}
exports.default = (program) => {
    program
        .command('add-sdk-version')
        .alias('add-sdk')
        .description('Versions code for the new SDK version.')
        .usage(`

To version code for the new SDK on iOS, run:
${chalk_1.default.gray('>')} ${chalk_1.default.italic.cyan('et add-sdk-version --platform ios')}

To backport changes made in unversioned code into already versioned SDK, run:
${chalk_1.default.gray('>')} ${chalk_1.default.italic.cyan('et add-sdk-version --platform ios --sdkVersion XX.0.0 --filenames */some/glob/expression/**')}`)
        .option('-p, --platform <string>', `Specifies a platform for which the SDK code should be generated. Supported platforms: ${chalk_1.default.cyan('ios')}.`)
        .option('-s, --sdkVersion [string]', 'SDK version to add. Defaults to the newest SDK version increased by a major update.')
        .option('-f, --filenames [string]', 'Glob pattern of file paths to version. Useful when you want to backport unversioned code into already versioned SDK. Optional. When provided, option `--sdkVersion` is required.')
        .option('-v, --vendored <string>', 'Name of the vendored module to (re)version. iOS only.', (value, previous) => (previous !== null && previous !== void 0 ? previous : []).concat(value), [])
        .option('-r, --reinstall', 'Whether to force reinstalling pods after generating a new version. iOS only.')
        .asyncAction(action);
};
//# sourceMappingURL=AddSDKVersion.js.map