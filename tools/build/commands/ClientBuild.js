"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
const askForPlatformAsync_1 = __importDefault(require("../utils/askForPlatformAsync"));
const askForSDKVersionAsync_1 = __importDefault(require("../utils/askForSDKVersionAsync"));
const Formatter_1 = require("../Formatter");
const Git_1 = __importDefault(require("../Git"));
const Logger_1 = __importDefault(require("../Logger"));
const Versions_1 = require("../Versions");
const IosClientBuilder_1 = __importDefault(require("../client-build/IosClientBuilder"));
const AndroidClientBuilder_1 = __importDefault(require("../client-build/AndroidClientBuilder"));
const ProjectVersions_1 = require("../ProjectVersions");
const s3Client = new aws_sdk_1.default.S3({ region: 'us-east-1' });
const { yellow, blue, magenta } = chalk_1.default;
exports.default = (program) => {
    program
        .command('client-build')
        .alias('cb')
        .description('Builds Expo client for iOS simulator or APK for Android, uploads the archive to S3 and saves its url to versions endpoint.')
        .option('-p, --platform [string]', 'Platform for which the client will be built.')
        .option('-r, --release', 'Whether to upload and release the client build to staging versions endpoint.', false)
        .asyncAction(main);
};
async function main(options) {
    const platform = options.platform || (await askForPlatformAsync_1.default());
    const sdkBranchVersion = await Git_1.default.getSDKVersionFromBranchNameAsync();
    if (options.release && !sdkBranchVersion) {
        throw new Error(`Client builds can be released only from the release branch!`);
    }
    const builder = getBuilderForPlatform(platform);
    const sdkVersion = sdkBranchVersion ||
        (await askForSDKVersionAsync_1.default(platform, await ProjectVersions_1.getNewestSDKVersionAsync(platform)));
    const appVersion = await builder.getAppVersionAsync();
    await buildOrUseCacheAsync(builder);
    if (sdkVersion && options.release) {
        await uploadAsync(builder, sdkVersion, appVersion);
        await releaseAsync(builder, sdkVersion, appVersion);
    }
}
function getBuilderForPlatform(platform) {
    switch (platform) {
        case 'ios':
            return new IosClientBuilder_1.default();
        case 'android':
            return new AndroidClientBuilder_1.default();
        default: {
            throw new Error(`Platform "${platform}" is not supported yet!`);
        }
    }
}
async function askToRecreateSimulatorBuildAsync() {
    if (process.env.CI) {
        return false;
    }
    const { createNew } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'createNew',
            message: 'Do you want to create a fresh one?',
            default: true,
        },
    ]);
    return createNew;
}
async function askToOverrideBuildAsync() {
    if (process.env.CI) {
        // we should never override anything in CI, too easy to accidentally mess something up in prod
        return false;
    }
    const { override } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'override',
            message: 'Do you want to override it?',
            default: true,
        },
    ]);
    return override;
}
async function buildOrUseCacheAsync(builder) {
    const appPath = builder.getAppPath();
    // Build directory already exists, we could reuse that one — especially useful on the CI.
    if (await fs_extra_1.default.pathExists(appPath)) {
        const relativeAppPath = path_1.default.relative(Constants_1.EXPO_DIR, appPath);
        Logger_1.default.info(`Client build already exists at ${magenta.bold(relativeAppPath)}`);
        if (!(await askToRecreateSimulatorBuildAsync())) {
            Logger_1.default.info('Skipped building the app, using cached build instead...');
            return;
        }
    }
    await builder.buildAsync();
}
async function uploadAsync(builder, sdkVersion, appVersion) {
    const sdkVersions = await Versions_1.getSdkVersionsAsync(sdkVersion);
    // Target app url already defined in versions endpoint.
    // We make this check to reduce the risk of unintentional overrides.
    if ((sdkVersions === null || sdkVersions === void 0 ? void 0 : sdkVersions[`${builder.platform}ClientUrl`]) === builder.getClientUrl(appVersion)) {
        Logger_1.default.info(`Build ${yellow.bold(appVersion)} is already defined in versions endpoint.`);
        Logger_1.default.info('The new build would be uploaded onto the same URL.');
        if (!(await askToOverrideBuildAsync())) {
            Logger_1.default.warn('Refused overriding the build, exiting the proces...');
            process.exit(0);
            return;
        }
    }
    Logger_1.default.info(`Uploading ${yellow.bold(appVersion)} build`);
    await builder.uploadBuildAsync(s3Client, appVersion);
}
async function releaseAsync(builder, sdkVersion, appVersion) {
    const clientUrl = builder.getClientUrl(appVersion);
    Logger_1.default.info(`Updating versions endpoint with client url ${blue.bold(Formatter_1.link(clientUrl, clientUrl))}`);
    await updateClientUrlAndVersionAsync(builder, sdkVersion, appVersion);
}
async function updateClientUrlAndVersionAsync(builder, sdkVersion, appVersion) {
    await Versions_1.modifySdkVersionsAsync(sdkVersion, (sdkVersions) => {
        sdkVersions[`${builder.platform}ClientUrl`] = builder.getClientUrl(appVersion);
        sdkVersions[`${builder.platform}ClientVersion`] = appVersion;
        return sdkVersions;
    });
}
//# sourceMappingURL=ClientBuild.js.map