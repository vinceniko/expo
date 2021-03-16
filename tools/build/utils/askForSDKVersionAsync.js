"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const semver_1 = __importDefault(require("semver"));
const inquirer_1 = __importDefault(require("inquirer"));
const ProjectVersions_1 = require("../ProjectVersions");
async function askForSDKVersionAsync(platform, defaultSdkVersion) {
    const sdkVersions = await ProjectVersions_1.getSDKVersionsAsync(platform);
    if (process.env.CI) {
        if (defaultSdkVersion) {
            console.log(`${chalk_1.default.red('`--sdkVersion`')} not provided - defaulting to ${chalk_1.default.cyan(defaultSdkVersion)}.`);
            return defaultSdkVersion;
        }
        throw new Error(`${chalk_1.default.red('`--sdkVersion`')} not provided and unable to obtain default value.`);
    }
    const defaultValue = defaultSdkVersion && sdkVersions.includes(defaultSdkVersion)
        ? defaultSdkVersion
        : sdkVersions[sdkVersions.length - 1];
    const { sdkVersion } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'sdkVersion',
            message: 'What is the SDK version that you want to run this script against?',
            default: defaultValue,
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
exports.default = askForSDKVersionAsync;
//# sourceMappingURL=askForSDKVersionAsync.js.map