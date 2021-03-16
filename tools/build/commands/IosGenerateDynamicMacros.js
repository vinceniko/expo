"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const generateDynamicMacros_1 = require("../dynamic-macros/generateDynamicMacros");
const expotools_1 = require("../expotools");
const EXPO_DIR = expotools_1.Directories.getExpoRepositoryRootDir();
const IOS_DIR = expotools_1.Directories.getIosDir();
const SUPPORTING_DIR = path_1.default.join(IOS_DIR, 'Exponent', 'Supporting');
const TEMPLATE_FILES_DIR = path_1.default.join(EXPO_DIR, 'template-files');
async function generateAction(options) {
    const buildConstantsPath = options.buildConstantsPath || path_1.default.join(SUPPORTING_DIR, 'EXBuildConstants.plist');
    const infoPlistPath = options.infoPlistPath || path_1.default.join(SUPPORTING_DIR, 'Info.plist');
    const configuration = options.configuration || process.env.CONFIGURATION;
    await generateDynamicMacros_1.generateDynamicMacrosAsync({
        buildConstantsPath,
        platform: 'ios',
        infoPlistPath,
        expoKitPath: EXPO_DIR,
        templateFilesPath: TEMPLATE_FILES_DIR,
        configuration,
        skipTemplates: options.skipTemplate,
    });
}
function collect(val, memo) {
    memo.push(val);
    return memo;
}
exports.default = (program) => {
    program
        .command('ios-generate-dynamic-macros')
        .option('--buildConstantsPath [string]', 'Path to EXBuildConstants.plist relative to `ios` folder. Optional.')
        .option('--infoPlistPath [string]', "Path to app's Info.plist relative to `ios` folder. Optional.")
        .option('--configuration [string]', 'Build configuration. Defaults to `process.env.CONFIGURATION`.')
        .option('--skip-template [string]', 'Skip generating a template (ie) GoogleService-Info.plist. Optional.', collect, [])
        .description('Generates dynamic macros for iOS client.')
        .asyncAction(generateAction);
};
//# sourceMappingURL=IosGenerateDynamicMacros.js.map