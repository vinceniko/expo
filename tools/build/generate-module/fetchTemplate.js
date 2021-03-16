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
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const pacote_1 = __importDefault(require("pacote"));
const path = __importStar(require("path"));
const DEFAULT_TEMPLATE = 'expo-module-template@latest';
/**
 * Fetches directory from npm or given templateDirectory into destinationPath
 * @param destinationPath - destination for fetched template
 * @param template - optional template provided as npm package or local directory
 */
async function fetchTemplate(destinationPath, template) {
    if (template && fs.existsSync(path.resolve(template))) {
        // local template
        xdl_1.Logger.global.info(`Using local template: ${chalk_1.default.bold(path.resolve(template))}.`);
        await fs.copy(path.resolve(template), destinationPath);
    }
    else if (template && isNpmPackage(template)) {
        // npm package
        xdl_1.Logger.global.info(`Using NPM package as template: ${chalk_1.default.bold(template)}`);
        await pacote_1.default.extract(template, destinationPath);
    }
    else {
        // default npm packge
        xdl_1.Logger.global.info(`Using default NPM package as template: ${chalk_1.default.bold(DEFAULT_TEMPLATE)}`);
        await pacote_1.default.extract(DEFAULT_TEMPLATE, destinationPath);
    }
    if (await fs.pathExists(path.join(destinationPath, 'template-unimodule.json'))) {
        await fs.move(path.join(destinationPath, 'template-unimodule.json'), path.join(destinationPath, 'unimodule.json'));
    }
}
exports.default = fetchTemplate;
function isNpmPackage(template) {
    return (!template.match(/^\./) && // don't start with .
        !template.match(/^_/) && // don't start with _
        template.toLowerCase() === template && // only lowercase
        !/[~'!()*]/.test(template.split('/').slice(-1)[0]) && // don't contain any character from [~'!()*]
        template.match(/^(@([^/]+?)\/)?([^/@]+)(@(((\d\.\d\.\d)(-[^/@]+)?)|latest|next))?$/) // has shape (@scope/)?actual-package-name(@0.1.1(-tag.1)?|tag-name)?
    );
}
//# sourceMappingURL=fetchTemplate.js.map