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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const Directories = __importStar(require("../Directories"));
async function resizeIconWithSharpAsync(iconSizePx, iconFilename, destinationIconPath) {
    const filename = path_1.default.join(destinationIconPath, iconFilename);
    // sharp can't have same input and output filename, so load to buffer then
    // write to disk after resize is complete
    let buffer = await sharp_1.default(filename).resize(iconSizePx, iconSizePx).toBuffer();
    fs_1.default.writeFileSync(filename, buffer);
}
async function getImageDimensionsWithSharpAsync(dirname, basename) {
    const filename = path_1.default.join(dirname, basename);
    try {
        let { width, height } = await sharp_1.default(filename).metadata();
        return { width, height };
    }
    catch (e) {
        return null;
    }
}
async function action(providedOptions) {
    xdl_1.ImageUtils.setResizeImageFunction(resizeIconWithSharpAsync);
    xdl_1.ImageUtils.setGetImageDimensionsFunction(getImageDimensionsWithSharpAsync);
    const options = {
        ...providedOptions,
        expoSourcePath: Directories.getIosDir(),
    };
    if (options.action === 'build') {
        return await xdl_1.IosShellApp.buildAndCopyArtifactAsync(options);
    }
    else if (options.action === 'configure') {
        return await xdl_1.IosShellApp.configureAndCopyArchiveAsync(options);
    }
    else if (options.action === 'create-workspace') {
        return await xdl_1.IosShellApp.createTurtleWorkspaceAsync(options);
    }
    else {
        throw new Error(`Unsupported action '${options.action}'.`);
    }
}
exports.default = (program) => {
    program
        .command('ios-shell-app')
        .description('Generates and builds an iOS shell app locally with the specified configuration')
        .option('-a, --action [string]', 'Action to perform: configure | build | create-workspace')
        .option('-u, --url [string]', 'Manifest URL')
        .option('-s, --sdkVersion [string]', 'SDK version to use when requesting the manifest')
        .option('--shellAppSdkVersion [string]', 'SDK version for the shell app', 'UNVERSIONED')
        .option('-r, --releaseChannel [string]', 'Release channel')
        .option('--manifest [string]', 'App manifest')
        .option('--skipRepoUpdate', 'Include if you want the CocoaPods repo update to be skipped')
        .option('-t, --type [string]', 'Type of build: simulator | archive | client', 'archive')
        .option('-c, --configuration [string]', 'Build configuration: Debug | Release', 'Release')
        .option('-v, --verbose [boolean]', 'Print verbose output', false)
        .option('--testEnvironment [string]', 'Test environment for the shell app: local | ci | none', 'none')
        .option('--privateConfigFile [string]', 'Path to a private config file containing, e.g., private api keys')
        .option('--appleTeamId [string]', `Apple Developer's account Team ID`)
        .option('--archivePath [string]', 'Path to existing NSBundle to configure (optional)')
        .option('--output [string]', 'Path where the archive should be created (optional)')
        .option('--workspacePath [string]', 'Path for the unbuilt xcode workspace to create/use (optional)')
        .asyncAction(action);
};
//# sourceMappingURL=IosShellApp.js.map