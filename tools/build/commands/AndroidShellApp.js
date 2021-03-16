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
const xdl_1 = require("@expo/xdl");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Directories = __importStar(require("../Directories"));
const ProjectVersions = __importStar(require("../ProjectVersions"));
async function action(options) {
    if (!options.url || !options.sdkVersion) {
        throw new Error('Must run with `--url MANIFEST_URL --sdkVersion SDK_VERSION`');
    }
    if (options.sdkVersion !== (await ProjectVersions.getNewestSDKVersionAsync('android'))) {
        throw new Error(`In order to build a shell app with SDK version ${options.sdkVersion} you need to check out that SDK's release branch.`);
    }
    if (!fs_extra_1.default.existsSync(path_1.default.join(Directories.getAndroidDir(), 'maven'))) {
        throw new Error('You need to build the aar packages locally before creating a shell app; run `et android-build-packages` and then rerun this command.');
    }
    xdl_1.AndroidShellApp.createAndroidShellAppAsync({
        buildMode: options.keystore ? 'release' : 'debug',
        buildType: 'apk',
        workingDir: Directories.getExpoRepositoryRootDir(),
        ...options,
        alias: options.keystoreAlias,
    });
}
exports.default = (program) => {
    program
        .command('android-shell-app')
        .description('Generates and builds an Android shell app locally with the specified configuration')
        .option('-u, --url [string]', 'Manifest URL')
        .option('-s, --sdkVersion [string]', 'SDK version')
        .option('-r, --releaseChannel [string]', 'Release channel')
        .option('-t, --buildType [string]', 'type of build: app-bundle|apk (default: apk)')
        .option('-m, --buildMode [string]', 'mode of build: debug|release (defaults to release if keystore is provided, debug otherwise)')
        .option('--modules [string]', 'list of modules to include in the build (defaults to all modules)')
        .option('--keystore [string]', 'Path to keystore (optional)')
        .option('--keystoreAlias [string]', 'Keystore alias (optional)')
        .option('--keystorePassword [string]', 'Keystore password (optional)')
        .option('--keyPassword [string]', 'Key password (optional)')
        .asyncAction(action);
};
//# sourceMappingURL=AndroidShellApp.js.map