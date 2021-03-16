"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFileWithTransformsAsync = exports.transformFileAsync = exports.transformString = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const minimatch_1 = __importDefault(require("minimatch"));
const path_1 = __importDefault(require("path"));
const Utils_1 = require("./Utils");
__exportStar(require("./Transforms.types"), exports);
/**
 * Transforms input string according to the given transform rules.
 */
function transformString(input, transforms) {
    if (!transforms) {
        return input;
    }
    return transforms.reduce(
    // @ts-ignore @tsapeta: TS gets crazy on `replaceWith` being a function.
    (acc, { find, replaceWith }) => acc.replace(find, replaceWith), input);
}
exports.transformString = transformString;
/**
 * Transforms file's content in-place.
 */
async function transformFileAsync(filePath, transforms) {
    const content = await fs_extra_1.default.readFile(filePath, 'utf8');
    await fs_extra_1.default.outputFile(filePath, transformString(content, transforms));
}
exports.transformFileAsync = transformFileAsync;
/**
 * Copies a file from source directory to target directory with transformed relative path and content.
 */
async function copyFileWithTransformsAsync(options) {
    var _a, _b;
    const { sourceFile, sourceDirectory, targetDirectory, transforms } = options;
    const sourcePath = path_1.default.join(sourceDirectory, sourceFile);
    // Transform the target path according to rename rules.
    const targetFile = transformString(sourceFile, transforms.path);
    const targetPath = path_1.default.join(targetDirectory, targetFile);
    // Filter out transforms that don't match paths patterns.
    const filteredContentTransforms = (_b = (_a = transforms.content) === null || _a === void 0 ? void 0 : _a.filter(({ paths }) => !paths ||
        Utils_1.arrayize(paths).some((pattern) => minimatch_1.default(sourceFile, pattern, { matchBase: true })))) !== null && _b !== void 0 ? _b : [];
    // Transform source content.
    const content = transformString(await fs_extra_1.default.readFile(sourcePath, 'utf8'), filteredContentTransforms);
    // Save transformed source file at renamed target path.
    await fs_extra_1.default.outputFile(targetPath, content);
    return {
        content,
        targetFile,
    };
}
exports.copyFileWithTransformsAsync = copyFileWithTransformsAsync;
//# sourceMappingURL=Transforms.js.map