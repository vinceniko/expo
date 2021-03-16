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
const IosVersioning = __importStar(require("../versioning/ios"));
const AndroidVersioning = __importStar(require("../versioning/android"));
const ProjectVersions_1 = require("../ProjectVersions");
const SUPPORTED_PLATFORMS = ['ios', 'android'];
async function getOldestOrAskForSDKVersionAsync(platform) {
    const sdkVersions = await ProjectVersions_1.getSDKVersionsAsync(platform);
    const defaultSdkVersion = await ProjectVersions_1.getOldestSDKVersionAsync(platform);
    if (defaultSdkVersion && process.env.CI) {
        console.log(`${chalk_1.default.red('`--sdkVersion`')} not provided - defaulting to ${chalk_1.default.cyan(defaultSdkVersion)}`);
        return defaultSdkVersion;
    }
    const { sdkVersion } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'sdkVersion',
            message: 'What is the SDK version that you want to remove?',
            default: defaultSdkVersion,
            choices: sdkVersions,
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
async function askForPlatformAsync() {
    if (process.env.CI) {
        throw new Error(`Run with \`--platform <${SUPPORTED_PLATFORMS.join(' | ')}>\`.`);
    }
    const { platform } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'platform',
            message: 'Choose a platform from which you want to remove SDK version:',
            default: SUPPORTED_PLATFORMS[0],
            choices: SUPPORTED_PLATFORMS,
        },
    ]);
    return platform;
}
async function action(options) {
    const platform = options.platform || (await askForPlatformAsync());
    const sdkVersion = options.sdkVersion || (await getOldestOrAskForSDKVersionAsync(options.platform));
    if (!sdkVersion) {
        throw new Error('Oldest SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
    }
    switch (platform) {
        case 'ios':
            return IosVersioning.removeVersionAsync(sdkVersion);
        case 'android':
            return AndroidVersioning.removeVersionAsync(sdkVersion);
        default:
            throw new Error(`Platform '${platform}' is not supported.`);
    }
}
exports.default = (program) => {
    program
        .command('remove-sdk-version')
        .alias('remove-sdk', 'rm-sdk', 'rs')
        .description('Removes SDK version.')
        .usage(`
    
To remove versioned code for the oldest supported SDK on iOS, run:
${chalk_1.default.gray('>')} ${chalk_1.default.italic.cyan('et remove-sdk-version --platform ios')}`)
        .option('-p, --platform <string>', `Specifies a platform for which the SDK code should be removed. Supported platforms: ${SUPPORTED_PLATFORMS.map((platform) => chalk_1.default.cyan(platform)).join(', ')}.`)
        .option('-s, --sdkVersion [string]', 'SDK version to remove. Defaults to the oldest supported SDK version.')
        .asyncAction(action);
};
//# sourceMappingURL=RemoveSDKVersion.js.map