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
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const configureModule_1 = __importDefault(require("./configureModule"));
const fetchTemplate_1 = __importDefault(require("./fetchTemplate"));
const promptQuestionsAsync_1 = __importDefault(require("./promptQuestionsAsync"));
const Constants_1 = require("../Constants");
const TEMPLATE_PACKAGE_NAME = 'expo-module-template';
async function generateModuleAsync(newModuleProjectDir, options) {
    console.log(`Creating new unimodule under ${chalk_1.default.magenta(path.relative(Constants_1.EXPO_DIR, newModuleProjectDir))}...`);
    let templatePath;
    if (options.template) {
        console.log(`Using custom module template: ${chalk_1.default.blue(options.template)}`);
        templatePath = options.template;
    }
    else if (options.useLocalTemplate) {
        templatePath = path.join(Constants_1.PACKAGES_DIR, TEMPLATE_PACKAGE_NAME);
        console.log(`Using local module template from ${chalk_1.default.blue(path.relative(Constants_1.EXPO_DIR, templatePath))}`);
    }
    const newModulePathFromArgv = newModuleProjectDir && path.resolve(newModuleProjectDir);
    const newModuleName = newModulePathFromArgv && path.basename(newModulePathFromArgv);
    const newModuleParentPath = newModulePathFromArgv
        ? path.dirname(newModulePathFromArgv)
        : process.cwd();
    const configuration = await promptQuestionsAsync_1.default(newModuleName);
    const newModulePath = path.resolve(newModuleParentPath, configuration.npmModuleName);
    if (fs.existsSync(newModulePath)) {
        throw new Error(`Module '${newModulePath}' already exists!`);
    }
    await fetchTemplate_1.default(newModulePath, templatePath);
    await configureModule_1.default(newModulePath, configuration);
}
exports.default = generateModuleAsync;
//# sourceMappingURL=generateModuleAsync.js.map