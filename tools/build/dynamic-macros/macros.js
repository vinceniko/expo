"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const xdl_1 = require("@expo/xdl");
const chalk_1 = __importDefault(require("chalk"));
const ip_1 = __importDefault(require("ip"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const v4_1 = __importDefault(require("uuid/v4"));
const Directories_1 = require("../Directories");
const ProjectVersions_1 = require("../ProjectVersions");
// some files are absent on turtle builders and we don't want log errors there
const isTurtle = !!process.env.TURTLE_WORKING_DIR_PATH;
const EXPO_DIR = Directories_1.getExpoRepositoryRootDir();
async function getManifestAsync(url, platform, sdkVersion) {
    const headers = {
        'Exponent-Platform': platform,
        Accept: 'application/expo+json,application/json',
    };
    if (sdkVersion) {
        headers['Exponent-SDK-Version'] = sdkVersion;
    }
    return await xdl_1.ExponentTools.getManifestAsync(url, headers, {
        logger: {
            log: () => { },
            error: () => { },
            info: () => { },
        },
    });
}
async function getSavedDevHomeUrlAsync() {
    const devHomeConfig = await new json_file_1.default(path_1.default.join(EXPO_DIR, 'dev-home-config.json')).readAsync();
    return devHomeConfig.url;
}
function kernelManifestObjectToJson(manifest) {
    if (!manifest.id) {
        // hack for now because unsigned manifest won't have an id
        manifest.id = '@exponent/home';
    }
    manifest.sdkVersion = 'UNVERSIONED';
    return JSON.stringify(manifest);
}
exports.default = {
    async TEST_APP_URI() {
        if (process.env.TEST_SUITE_URI) {
            return process.env.TEST_SUITE_URI;
        }
        else {
            try {
                let testSuitePath = path_1.default.join(__dirname, '..', 'apps', 'test-suite');
                let status = await xdl_1.Project.currentStatus(testSuitePath);
                if (status === 'running') {
                    return await xdl_1.UrlUtils.constructManifestUrlAsync(testSuitePath);
                }
                else {
                    return '';
                }
            }
            catch (e) {
                return '';
            }
        }
    },
    async TEST_CONFIG() {
        if (process.env.TEST_CONFIG) {
            return process.env.TEST_CONFIG;
        }
        else {
            return '';
        }
    },
    async TEST_SERVER_URL() {
        let url = 'TODO';
        try {
            let lanAddress = ip_1.default.address();
            let localServerUrl = `http://${lanAddress}:3013`;
            let result = await request_promise_native_1.default.get({
                url: `${localServerUrl}/expo-test-server-status`,
                timeout: 500,
                resolveWithFullResponse: true,
            });
            if (result.body === 'running!') {
                url = localServerUrl;
            }
        }
        catch (e) { }
        return url;
    },
    async TEST_RUN_ID() {
        return process.env.UNIVERSE_BUILD_ID || v4_1.default();
    },
    async BUILD_MACHINE_LOCAL_HOSTNAME() {
        if (process.env.SHELL_APP_BUILDER) {
            return '';
        }
        try {
            let result = await spawn_async_1.default('scutil', ['--get', 'LocalHostName']);
            return `${result.stdout.trim()}.local`;
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                console.error(e.stack);
            }
            return os_1.default.hostname();
        }
    },
    async DEV_PUBLISHED_KERNEL_MANIFEST(platform) {
        let manifest, savedDevHomeUrl;
        try {
            savedDevHomeUrl = await getSavedDevHomeUrlAsync();
            const sdkVersion = await this.TEMPORARY_SDK_VERSION();
            manifest = await getManifestAsync(savedDevHomeUrl, platform, sdkVersion);
        }
        catch (e) {
            const msg = `Unable to download manifest from ${savedDevHomeUrl}: ${e.message}`;
            console[isTurtle ? 'debug' : 'error'](msg);
            return '';
        }
        return kernelManifestObjectToJson(manifest);
    },
    async BUILD_MACHINE_KERNEL_MANIFEST(platform) {
        if (process.env.SHELL_APP_BUILDER) {
            return '';
        }
        const pathToHome = 'home';
        const url = await xdl_1.UrlUtils.constructManifestUrlAsync(path_1.default.join(EXPO_DIR, pathToHome));
        try {
            const manifest = await getManifestAsync(url, platform, null);
            if (manifest.name !== 'expo-home') {
                console.log(`Manifest at ${url} is not expo-home; using published kernel manifest instead...`);
                return '';
            }
            return kernelManifestObjectToJson(manifest);
        }
        catch (e) {
            console.error(chalk_1.default.red(`Unable to generate manifest from ${chalk_1.default.cyan(pathToHome)}: Failed to fetch manifest from ${chalk_1.default.cyan(url)}`));
            return '';
        }
    },
    async TEMPORARY_SDK_VERSION() {
        return await ProjectVersions_1.getHomeSDKVersionAsync();
    },
    INITIAL_URL() {
        return null;
    },
};
//# sourceMappingURL=macros.js.map