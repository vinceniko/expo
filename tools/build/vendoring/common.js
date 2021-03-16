"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyVendoredFilesAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../Logger"));
const Transforms_1 = require("../Transforms");
/**
 * Copies vendored files from source directory to target directory
 * with transforms applied to their content and relative path.
 */
async function copyVendoredFilesAsync(files, options) {
    for (const sourceFile of files) {
        const { targetFile } = await Transforms_1.copyFileWithTransformsAsync({ sourceFile, ...options });
        if (sourceFile !== targetFile) {
            Logger_1.default.log('📂 Renamed %s to %s', chalk_1.default.magenta(sourceFile), chalk_1.default.magenta(targetFile));
        }
    }
}
exports.copyVendoredFilesAsync = copyVendoredFilesAsync;
//# sourceMappingURL=common.js.map