"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const xdl_1 = require("@expo/xdl");
const Constants_1 = require("../Constants");
const askForPlatformAsync_1 = __importDefault(require("../utils/askForPlatformAsync"));
const askForSDKVersionAsync_1 = __importDefault(require("../utils/askForSDKVersionAsync"));
const ProjectVersions_1 = require("../ProjectVersions");
async function downloadAndInstallOnIOSAsync(clientUrl) {
    if (!(await xdl_1.Simulator.isSimulatorInstalledAsync())) {
        console.error(chalk_1.default.red('iOS simulator is not installed!'));
        return;
    }
    console.log('Booting up iOS simulator...');
    const simulator = await xdl_1.Simulator.ensureSimulatorOpenAsync();
    console.log('Uninstalling previously installed Expo client...');
    await xdl_1.Simulator.uninstallExpoAppFromSimulatorAsync(simulator);
    console.log(`Installing Expo client from ${chalk_1.default.blue(clientUrl)} on iOS simulator...`);
    const installResult = await xdl_1.Simulator.installExpoOnSimulatorAsync({ url: clientUrl, simulator });
    if (installResult.status !== 0) {
        throw new Error('Installing Expo client simulator failed!');
    }
    const appIdentifier = 'host.exp.Exponent';
    console.log(`Launching Expo client with identifier ${chalk_1.default.blue(appIdentifier)}...`);
    await spawn_async_1.default('xcrun', ['simctl', 'launch', 'booted', appIdentifier]);
}
async function downloadAndInstallOnAndroidAsync(clientUrl) {
    try {
        console.log('Checking if the are any Android devices or emulators connected...');
        const devices = await xdl_1.Android.getAttachedDevicesAsync();
        if (devices.length === 0) {
            throw new Error('No connected devices or emulators found.');
        }
        const device = devices[0];
        if (devices.length > 1) {
            console.log(`More than one Android device found. Installing on the first one found, ${device.name}.`);
        }
        if (!device.isAuthorized) {
            throw new Error(`This computer is not authorized for developing on ${device.name}. See https://expo.fyi/authorize-android-device.`);
        }
        console.log('Uninstalling previously installed Expo client...');
        await xdl_1.Android.uninstallExpoAsync(device);
        console.log(`Installing Expo client from ${chalk_1.default.blue(clientUrl)} on Android ${device.type}...`);
        await xdl_1.Android.installExpoAsync({ url: clientUrl, device });
        console.log('Launching application...');
        await xdl_1.Android.getAdbOutputAsync([
            'shell',
            'am',
            'start',
            '-n',
            `host.exp.exponent/.LauncherActivity`,
        ]);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Unable to install Expo client: ${error.message}`));
    }
}
async function action(options) {
    var _a;
    const platform = options.platform || (await askForPlatformAsync_1.default());
    const sdkVersion = options.sdkVersion ||
        (await askForSDKVersionAsync_1.default(platform, await ProjectVersions_1.getNewestSDKVersionAsync(platform)));
    if (!sdkVersion) {
        throw new Error(`Unable to find SDK version. Try to use ${chalk_1.default.yellow('--sdkVersion')} flag.`);
    }
    // Set XDL config to use staging
    xdl_1.Config.api.host = Constants_1.STAGING_API_HOST;
    const versions = await xdl_1.Versions.versionsAsync();
    const sdkConfiguration = (_a = versions === null || versions === void 0 ? void 0 : versions.sdkVersions) === null || _a === void 0 ? void 0 : _a[sdkVersion];
    if (!sdkConfiguration) {
        throw new Error(`Versions configuration for SDK ${chalk_1.default.cyan(sdkVersion)} not found!`);
    }
    const tarballKey = `${platform}ClientUrl`;
    const clientUrl = sdkConfiguration[tarballKey];
    if (!clientUrl) {
        throw new Error(`Client url not found at ${chalk_1.default.yellow(tarballKey)} key of versions config!`);
    }
    switch (platform) {
        case 'ios': {
            await downloadAndInstallOnIOSAsync(clientUrl);
            break;
        }
        case 'android': {
            await downloadAndInstallOnAndroidAsync(clientUrl);
            break;
        }
        default: {
            throw new Error(`Platform "${platform}" not implemented!`);
        }
    }
    console.log(chalk_1.default.green('Successfully installed and launched staging version of the client 🎉'));
}
exports.default = (program) => {
    program
        .command('client-install')
        .alias('ci')
        .description('Installs staging version of the client on iOS simulator, Android emulator or connected Android device.')
        .option('-p, --platform [string]', 'Platform for which the client will be installed.')
        .option('-s, --sdkVersion [string]', 'SDK version of the client to install.')
        .asyncAction(action);
};
//# sourceMappingURL=ClientInstall.js.map