"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
/**
 * Generates CocoaPod name in format `Namepart1Namepart2Namepart3`.
 * For these with `expo` as `partname1` would generate `EXNamepart2...`.
 * @param {string} moduleName - provided module name, expects format: `namepart1-namepart2-namepart3`
 */
const generateCocoaPodDefaultName = (moduleName) => {
    const wordsToUpperCase = (s) => s
        .toLowerCase()
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join('');
    if (moduleName.toLowerCase().startsWith('expo')) {
        return `EX${wordsToUpperCase(moduleName.substring(4))}`;
    }
    return `EX${wordsToUpperCase(moduleName)}`;
};
/**
 * Generates java package name in format `namepart1.namepart2.namepart3`.
 * @param moduleName - provided module name, expects format: `namepart1-namepart2-namepart3`
 */
const generateJavaModuleDefaultName = (moduleName) => {
    const wordsToJavaModule = (s) => s.toLowerCase().split('-').join('');
    if (moduleName.toLowerCase().startsWith('expo')) {
        return `expo.modules.${wordsToJavaModule(moduleName.substring(4))}`;
    }
    return wordsToJavaModule(moduleName);
};
/**
 * Generates JS/TS module name in format `Namepart1Namepart2Namepart3`.
 * @param moduleName - provided module name, expects format: `namepart1-namepart2-namepart3`
 */
const generateInCodeModuleDefaultName = (moduleName) => {
    return moduleName
        .toLowerCase()
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join('');
};
/**
 * Generates questions
 */
const generateQuestions = (suggestedModuleName) => [
    {
        name: 'npmModuleName',
        message: 'How would you like to call your module in JS/npm? (eg. expo-camera)',
        default: suggestedModuleName,
        validate: (answer) => {
            return !answer.length
                ? 'Module name cannot be empty'
                : /[A-Z]/.test(answer)
                    ? 'Module name cannot contain any upper case characters'
                    : /\s/.test(answer)
                        ? 'Module name cannot contain any whitespaces'
                        : true;
        },
    },
    {
        name: 'podName',
        message: 'How would you like to call your module in CocoaPods? (eg. EXCamera)',
        default: ({ npmModuleName }) => generateCocoaPodDefaultName(npmModuleName),
        validate: (answer) => !answer.length
            ? 'CocoaPod name cannot be empty'
            : /\s/.test(answer)
                ? 'CocoaPod name cannot contain any whitespaces'
                : true,
    },
    {
        name: 'javaPackage',
        message: 'How would you like to call your module in Java? (eg. expo.modules.camera)',
        default: ({ npmModuleName }) => generateJavaModuleDefaultName(npmModuleName),
        validate: (answer) => !answer.length
            ? 'Java Package name cannot be empty'
            : /\s/.test(answer)
                ? 'Java Package name cannot contain any whitespaces'
                : true,
    },
    {
        name: 'jsPackageName',
        message: 'How would you like to call your module in JS/TS codebase (eg. ExpoCamera)?',
        default: ({ npmModuleName }) => generateInCodeModuleDefaultName(npmModuleName),
        validate: (answer) => !answer.length
            ? 'Module name cannot be empty'
            : /\s/.test(answer)
                ? 'Module name cannot contain any whitespaces'
                : true,
    },
    {
        name: 'viewManager',
        message: 'Would you like to create a NativeViewManager?',
        default: false,
        type: 'confirm',
    },
];
/**
 * Prompt user about new module namings.
 * @param suggestedModuleName - suggested module name that would be used to generate all suggestions for each question
 */
async function promptQuestionsAsync(suggestedModuleName) {
    const questions = generateQuestions(suggestedModuleName);
    // non interactive check
    if (!process.stdin.isTTY) {
        let message = `Input is required, but expotools is in a non-interactive shell.\n`;
        const firstQuestion = (questions[0].message || '');
        message += `Required input:\n${firstQuestion.trim().replace(/^/gm, '> ')}`;
        throw new Error(message);
    }
    // TODO: Migrate to prompts and remove inquirer
    return (await inquirer_1.default.prompt(questions));
}
exports.default = promptQuestionsAsync;
//# sourceMappingURL=promptQuestionsAsync.js.map