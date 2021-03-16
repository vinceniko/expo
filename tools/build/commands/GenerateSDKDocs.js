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
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Directories = __importStar(require("../Directories"));
const Transforms_1 = require("../Transforms");
const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path_1.default.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path_1.default.join(DOCS_DIR, 'pages', 'versions');
const STATIC_EXAMPLES_DIR = path_1.default.join(DOCS_DIR, 'public', 'static', 'examples');
async function action(options) {
    const { sdk, updateReactNativeDocs } = options;
    if (!sdk) {
        throw new Error('Must run with `--sdk SDK_VERSION`.');
    }
    if (updateReactNativeDocs) {
        const reactNativeWebsiteDir = path_1.default.join(DOCS_DIR, 'react-native-website');
        const reactNativePackageJsonPath = path_1.default.join(EXPO_DIR, 'react-native-lab', 'react-native', 'package.json');
        const reactNativeVersion = await json_file_1.default.getAsync(reactNativePackageJsonPath, 'version', null);
        if (!reactNativeVersion) {
            throw new Error(`React Native version not found at ${reactNativePackageJsonPath}`);
        }
        console.log(`Updating ${chalk_1.default.cyan('react-native-website')} submodule...`);
        await spawn_async_1.default('git', ['checkout', 'master'], {
            cwd: reactNativeWebsiteDir,
        });
        await spawn_async_1.default('git', ['pull'], {
            cwd: reactNativeWebsiteDir,
        });
        console.log(`Importing React Native docs to ${chalk_1.default.yellow('unversioned')} directory...\n`);
        await fs_extra_1.default.remove(path_1.default.join(SDK_DOCS_DIR, 'unversioned', 'react-native'));
        await spawn_async_1.default('et', ['update-react-native-docs', '--sdk', 'unversioned'], {
            stdio: 'inherit',
            cwd: DOCS_DIR,
        });
    }
    const targetSdkDirectory = path_1.default.join(SDK_DOCS_DIR, `v${sdk}`);
    const targetExampleDirectory = path_1.default.join(STATIC_EXAMPLES_DIR, `v${sdk}`);
    if (await fs_extra_1.default.pathExists(targetSdkDirectory)) {
        console.log(chalk_1.default.magenta(`v${sdk}`), 'directory already exists. Skipping copy operation.');
    }
    else {
        console.log(`Copying ${chalk_1.default.yellow('unversioned')} docs to ${chalk_1.default.yellow(`v${sdk}`)} directory...`);
        await fs_extra_1.default.copy(path_1.default.join(SDK_DOCS_DIR, 'unversioned'), targetSdkDirectory);
        // Version the sourcecode URLs for the API pages
        const apiPages = await fs_extra_1.default.readdir(path_1.default.join(targetSdkDirectory, 'sdk'));
        await Promise.all(apiPages.map(async (api) => {
            const apiFilePath = path_1.default.join(targetSdkDirectory, 'sdk', api);
            await Transforms_1.transformFileAsync(apiFilePath, [
                {
                    find: /(sourceCodeUrl:.*?\/tree\/)(master)(\/packages[^\n]*)/,
                    replaceWith: `$1sdk-${sdk.substring(0, 2)}$3`,
                },
            ]);
        }));
    }
    if (await fs_extra_1.default.pathExists(targetExampleDirectory)) {
        console.log(chalk_1.default.magenta(`v${sdk}`), 'examples directory already exists. Skipping copy operation.');
    }
    else {
        console.log(`Copying ${chalk_1.default.yellow('unversioned')} static examples to ${chalk_1.default.yellow(`v${sdk}`)} directory...`);
        await fs_extra_1.default.copy(path_1.default.join(STATIC_EXAMPLES_DIR, 'unversioned'), targetExampleDirectory);
    }
    console.log(`\nDocs version ${chalk_1.default.red(sdk)} created successfully. By default, it will not be included in the production build.` +
        `\nWhen the new version is ready to deploy, set version to ${chalk_1.default.red(sdk)} in ${chalk_1.default.yellow('docs/package.json')}`);
}
exports.default = (program) => {
    program
        .command('generate-sdk-docs')
        .option('--sdk <string>', 'SDK version of docs to generate.')
        .option('--update-react-native-docs', 'Whether to update React Native docs.')
        .description(`Copies unversioned docs and static examples to SDK-specific folder.`)
        .asyncAction(action);
};
//# sourceMappingURL=GenerateSDKDocs.js.map