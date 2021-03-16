"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const generateDynamicMacros_1 = require("../dynamic-macros/generateDynamicMacros");
const expotools_1 = require("../expotools");
const EXPO_DIR = expotools_1.Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = expotools_1.Directories.getAndroidDir();
const GENERATED_DIR = path_1.default.join(ANDROID_DIR, 'expoview/src/main/java/host/exp/exponent/generated');
const TEMPLATE_FILES_DIR = path_1.default.join(EXPO_DIR, 'template-files');
async function generateAction(options) {
    const buildConstantsPath = options.buildConstantsPath || path_1.default.join(GENERATED_DIR, 'ExponentBuildConstants.java');
    const configuration = options.configuration || process.env.CONFIGURATION || 'release';
    await generateDynamicMacros_1.generateDynamicMacrosAsync({
        buildConstantsPath,
        platform: 'android',
        expoKitPath: EXPO_DIR,
        templateFilesPath: TEMPLATE_FILES_DIR,
        configuration,
    });
}
exports.default = (program) => {
    program
        .command('android-generate-dynamic-macros')
        .option('--buildConstantsPath [string]', 'Path to ExponentBuildConstants.java relative to `android` folder. Optional.')
        .option('--configuration [string]', 'Build configuration. Defaults to `process.env.CONFIGURATION` or "debug".')
        .description('Generates dynamic macros for Android client.')
        .asyncAction(generateAction);
};
//# sourceMappingURL=AndroidGenerateDynamicMacros.js.map