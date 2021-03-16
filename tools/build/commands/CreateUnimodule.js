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
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const Constants_1 = require("../Constants");
const generateModuleAsync_1 = __importDefault(require("../generate-module/generateModuleAsync"));
const Utils_1 = require("../Utils");
async function setupExpoModuleScripts(unimoduleDirectory) {
    const packageJsonPath = path.join(unimoduleDirectory, 'package.json');
    const packageJson = new json_file_1.default(packageJsonPath);
    const moduleScriptsVersion = (await json_file_1.default.getAsync(path.join(Constants_1.PACKAGES_DIR, 'expo-module-scripts', 'package.json'), 'version', ''));
    console.log(`Installing ${chalk_1.default.bold.green('expo-module-scripts')}...`);
    await Utils_1.spawnAsync('yarn', ['add', '--dev', `expo-module-scripts@^${moduleScriptsVersion}`], {
        cwd: unimoduleDirectory,
    });
    console.log(`Setting up ${chalk_1.default.magenta(path.relative(Constants_1.EXPO_DIR, packageJsonPath))}...`);
    await packageJson.setAsync('scripts', {
        build: 'expo-module build',
        clean: 'expo-module clean',
        lint: 'expo-module lint',
        test: 'expo-module test',
        prepare: 'expo-module prepare',
        prepublishOnly: 'expo-module prepublishOnly',
        'expo-module': 'expo-module',
    });
    await packageJson.setAsync('repository', {
        type: 'git',
        url: 'https://github.com/expo/expo.git',
        directory: path.relative(Constants_1.EXPO_DIR, unimoduleDirectory),
    });
    await packageJson.setAsync('bugs', {
        url: 'https://github.com/expo/expo/issues',
    });
    await packageJson.setAsync('jest', {
        preset: 'expo-module-scripts/ios',
    });
    // `expo generate-module` left some junk fields in package.json
    // TODO(@tsapeta): Probably these keys should be deleted by CLI, but I'd like to do this separately since it needs some other changes as well.
    await packageJson.deleteKeysAsync(['gitHead', '_resolved', '_integrity', '_from']);
}
async function action(options) {
    if (!options.name) {
        throw new Error('Missing unimodule name. Run with `--name <string>`.');
    }
    const unimoduleDirectory = path.join(Constants_1.PACKAGES_DIR, options.name);
    await generateModuleAsync_1.default(unimoduleDirectory, options);
    await setupExpoModuleScripts(unimoduleDirectory);
}
exports.default = (program) => {
    program
        .command('create-unimodule')
        .alias('cu')
        .description('Creates a new unimodule under the `packages` folder.')
        .option('-n, --name <string>', 'Name of the package to create.', null)
        .option('--use-local-template', 'Uses local `packages/expo-module-template` instead of the one published to NPM. Ignored when -t option is used.')
        .option('-t, --template <string>', 'Local directory or npm package containing template for unimodule')
        .asyncAction(action);
};
//# sourceMappingURL=CreateUnimodule.js.map