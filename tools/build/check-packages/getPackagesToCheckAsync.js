"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Git_1 = __importDefault(require("../Git"));
const Logger_1 = __importDefault(require("../Logger"));
const Formatter_1 = require("../Formatter");
const Packages_1 = require("../Packages");
const { yellow } = chalk_1.default;
async function safeGetMergeBaseAsync(ref) {
    try {
        return await Git_1.default.mergeBaseAsync(ref);
    }
    catch (e) {
        Logger_1.default.error(`🛑 Cannot get merge base for reference: ${yellow(ref)}\n`, e.stack);
        return null;
    }
}
/**
 * Resolves which packages should go through checks based on given options.
 */
async function getPackagesToCheckAsync(options) {
    var _a;
    const { all, packageNames } = options;
    const allPackages = (await Packages_1.getListOfPackagesAsync()).filter((pkg) => {
        // If the package doesn't have build or test script, just skip it.
        return pkg.scripts.build || pkg.scripts.test;
    });
    if (all) {
        return allPackages;
    }
    if (packageNames.length > 0) {
        return allPackages.filter((pkg) => {
            return packageNames.includes(pkg.packageName);
        });
    }
    const sinceRef = (_a = options.since) !== null && _a !== void 0 ? _a : 'master';
    const mergeBase = await safeGetMergeBaseAsync(sinceRef);
    if (!mergeBase) {
        Logger_1.default.warn(`😿 Couldn't find merge base with ${yellow(sinceRef)}, falling back to all packages\n`);
        return allPackages;
    }
    Logger_1.default.info(`😺 Using incremental checks since ${Formatter_1.formatCommitHash(mergeBase)} commit\n`);
    const changedFiles = await Git_1.default.logFilesAsync({ fromCommit: mergeBase });
    return allPackages.filter((pkg) => {
        const pkgPath = pkg.path.replace(/([^\/])$/, '$1/');
        return changedFiles.some(({ path }) => path.startsWith(pkgPath));
    });
}
exports.default = getPackagesToCheckAsync;
//# sourceMappingURL=getPackagesToCheckAsync.js.map