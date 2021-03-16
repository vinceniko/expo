"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateSubstitutionsAsync = exports.generateDynamicMacrosAsync = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const expotools_1 = require("../expotools");
const AndroidMacrosGenerator_1 = __importDefault(require("./AndroidMacrosGenerator"));
const IosMacrosGenerator_1 = __importDefault(require("./IosMacrosGenerator"));
const macros_1 = __importDefault(require("./macros"));
const EXPO_DIR = expotools_1.Directories.getExpoRepositoryRootDir();
async function getTemplateSubstitutionsFromSecrets() {
    try {
        return await new json_file_1.default(path_1.default.join(EXPO_DIR, 'secrets', 'keys.json')).readAsync();
    }
    catch (e) {
        // Don't have access to decrypted secrets, use public keys
        console.log("You don't have access to decrypted secrets. Falling back to `template-files/keys.json`.");
        return await new json_file_1.default(path_1.default.join(EXPO_DIR, 'template-files', 'keys.json')).readAsync();
    }
}
async function getTemplateSubstitutionsAsync() {
    const defaultKeys = await getTemplateSubstitutionsFromSecrets();
    try {
        // Keys from secrets/template-files can be overwritten by private-keys.json file.
        const privateKeys = await new json_file_1.default(path_1.default.join(EXPO_DIR, 'private-keys.json')).readAsync();
        return { ...defaultKeys, ...privateKeys };
    }
    catch (error) {
        return defaultKeys;
    }
}
exports.getTemplateSubstitutionsAsync = getTemplateSubstitutionsAsync;
async function generateMacrosAsync(platform, configuration) {
    const macrosObject = {};
    console.log('Resolving macros...');
    for (const [name, func] of Object.entries(macros_1.default)) {
        // @ts-ignore
        const macroValue = await func.call(macros_1.default, platform, configuration);
        macrosObject[name] = macroValue;
        console.log('Resolved %s macro to %s', chalk_1.default.green(name), chalk_1.default.yellow(JSON.stringify(macroValue)));
    }
    console.log();
    return macrosObject;
}
function getMacrosGeneratorForPlatform(platform) {
    if (platform === 'ios') {
        return new IosMacrosGenerator_1.default();
    }
    if (platform === 'android') {
        return new AndroidMacrosGenerator_1.default();
    }
    throw new Error(`Platform '${platform}' is not supported.`);
}
async function generateDynamicMacrosAsync(args) {
    try {
        const { platform } = args;
        const templateSubstitutions = await getTemplateSubstitutionsAsync();
        const macros = await generateMacrosAsync(platform, args.configuration);
        const macrosGenerator = getMacrosGeneratorForPlatform(platform);
        await macrosGenerator.generateAsync({ ...args, macros, templateSubstitutions });
        // Copy template files - it is platform-agnostic.
        await copyTemplateFilesAsync(platform, args, templateSubstitutions);
    }
    catch (error) {
        console.error(`There was an error while generating Expo template files, which could lead to unexpected behavior at runtime:\n${error.stack}`);
        process.exit(1);
    }
}
exports.generateDynamicMacrosAsync = generateDynamicMacrosAsync;
async function readExistingSourceAsync(filepath) {
    try {
        return await fs_extra_1.default.readFile(filepath, 'utf8');
    }
    catch (e) {
        return null;
    }
}
async function copyTemplateFileAsync(source, dest, templateSubstitutions, configuration, isOptional) {
    let [currentSourceFile, currentDestFile] = await Promise.all([
        readExistingSourceAsync(source),
        readExistingSourceAsync(dest),
    ]);
    if (!currentSourceFile) {
        console.error(`Couldn't find ${chalk_1.default.magenta(source)} file.`);
        process.exit(1);
    }
    for (const [textToReplace, value] of Object.entries(templateSubstitutions)) {
        currentSourceFile = currentSourceFile.replace(new RegExp(`\\$\\{${textToReplace}\\}`, 'g'), value);
    }
    if (configuration === 'debug') {
        // We need these permissions when testing but don't want them
        // ending up in our release.
        currentSourceFile = currentSourceFile.replace(`<!-- ADD TEST PERMISSIONS HERE -->`, `<uses-permission android:name="android.permission.WRITE_CONTACTS" />`);
    }
    if (currentSourceFile !== currentDestFile) {
        try {
            await fs_extra_1.default.writeFile(dest, currentSourceFile, 'utf8');
        }
        catch (error) {
            if (!isOptional)
                throw error;
        }
    }
}
async function copyTemplateFilesAsync(platform, args, templateSubstitutions) {
    const templateFilesPath = args.templateFilesPath || path_1.default.join(EXPO_DIR, 'template-files');
    const templatePathsFile = (await new json_file_1.default(path_1.default.join(templateFilesPath, `${platform}-paths.json`)).readAsync());
    const templatePaths = { ...templatePathsFile.paths, ...templatePathsFile.generateOnly };
    const checkIgnoredTemplatePaths = Object.values(templatePathsFile.generateOnly);
    const promises = [];
    const skipTemplates = args.skipTemplates || [];
    for (const [source, dest] of Object.entries(templatePaths)) {
        if (skipTemplates.includes(source)) {
            console.log('Skipping template %s ...', chalk_1.default.cyan(path_1.default.join(templateFilesPath, platform, source)));
            continue;
        }
        const isOptional = checkIgnoredTemplatePaths.includes(dest);
        console.log('Rendering %s from template %s %s...', chalk_1.default.cyan(path_1.default.join(EXPO_DIR, dest)), chalk_1.default.cyan(path_1.default.join(templateFilesPath, platform, source)), isOptional ? chalk_1.default.yellow('(Optional) ') : '');
        promises.push(copyTemplateFileAsync(path_1.default.join(templateFilesPath, platform, source), path_1.default.join(EXPO_DIR, dest), templateSubstitutions, args.configuration, isOptional));
    }
    await Promise.all(promises);
}
//# sourceMappingURL=generateDynamicMacros.js.map