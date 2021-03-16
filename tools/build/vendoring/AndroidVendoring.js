"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorAsync = void 0;
const Utils_1 = require("../Utils");
const common_1 = require("./common");
async function vendorAsync(sourceDirectory, targetDirectory, config = {}) {
    var _a, _b;
    // Get a list of source files for Android. Usually we'll just fall back to `android` directory.
    const files = await Utils_1.searchFilesAsync(sourceDirectory, (_a = config.includeFiles) !== null && _a !== void 0 ? _a : 'android/**', {
        ignore: config.excludeFiles,
    });
    await common_1.copyVendoredFilesAsync(files, {
        sourceDirectory,
        targetDirectory,
        transforms: (_b = config === null || config === void 0 ? void 0 : config.transforms) !== null && _b !== void 0 ? _b : {},
    });
}
exports.vendorAsync = vendorAsync;
//# sourceMappingURL=AndroidVendoring.js.map