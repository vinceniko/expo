"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionVendoredModulesAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../../Constants");
const Logger_1 = __importDefault(require("../../Logger"));
const Transforms_1 = require("../../Transforms");
const Utils_1 = require("../../Utils");
const vendoredModulesTransforms_1 = __importDefault(require("./transforms/vendoredModulesTransforms"));
const IOS_VENDORED_DIR = path_1.default.join(Constants_1.IOS_DIR, 'vendored');
/**
 * Versions iOS vendored modules.
 */
async function versionVendoredModulesAsync(sdkNumber, filterModules) {
    var _a, _b;
    const prefix = `ABI${sdkNumber}_0_0`;
    const config = vendoredModulesTransforms_1.default(prefix);
    const baseTransforms = baseTransformsFactory(prefix);
    const unversionedDir = path_1.default.join(IOS_VENDORED_DIR, 'unversioned');
    const versionedDir = path_1.default.join(IOS_VENDORED_DIR, `sdk${sdkNumber}`);
    const sourceDirents = (await fs_extra_1.default.readdir(unversionedDir, { withFileTypes: true })).filter((dirent) => {
        return dirent.isDirectory() && (!filterModules || filterModules.includes(dirent.name));
    });
    for (const { name } of sourceDirents) {
        Logger_1.default.info('🔃 Versioning vendored module %s', chalk_1.default.green(name));
        const moduleConfig = config[name];
        const sourceDirectory = path_1.default.join(unversionedDir, name);
        const targetDirectory = path_1.default.join(versionedDir, name);
        const files = await Utils_1.searchFilesAsync(sourceDirectory, '**');
        await fs_extra_1.default.remove(targetDirectory);
        for (const sourceFile of files) {
            await Transforms_1.copyFileWithTransformsAsync({
                sourceFile,
                sourceDirectory,
                targetDirectory,
                transforms: {
                    path: [...baseTransforms.path, ...((_a = moduleConfig === null || moduleConfig === void 0 ? void 0 : moduleConfig.path) !== null && _a !== void 0 ? _a : [])],
                    content: [...baseTransforms.content, ...((_b = moduleConfig === null || moduleConfig === void 0 ? void 0 : moduleConfig.content) !== null && _b !== void 0 ? _b : [])],
                },
            });
        }
    }
}
exports.versionVendoredModulesAsync = versionVendoredModulesAsync;
/**
 * Generates base transforms to apply for all vendored modules.
 */
function baseTransformsFactory(prefix) {
    return {
        path: [
            {
                find: /([^/]+\.podspec\.json)$\b/,
                replaceWith: `${prefix}$1`,
            },
            {
                find: /\b(RNC[^/]*\.)(h|m|mm)/,
                replaceWith: `${prefix}$1$2`,
            },
        ],
        content: [
            {
                paths: '*.podspec.json',
                find: /"name": "([\w-]+)"/,
                replaceWith: `"name": "${prefix}$1"`,
            },
            {
                find: /\b(React)/g,
                replaceWith: `${prefix}$1`,
            },
            {
                find: /\b(RCT|RNC)(\w+)\b/g,
                replaceWith: `${prefix}$1$2`,
            },
            {
                paths: '*.swift',
                find: /@objc\(([^)]+)\)/g,
                replaceWith: `@objc(${prefix}$1)`,
            },
        ],
    };
}
//# sourceMappingURL=versionVendoredModules.js.map