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
exports.getVendoringAvailablePlatforms = exports.listAvailableVendoredModulesAsync = exports.vendorPlatformAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const semver_1 = __importDefault(require("semver"));
const Formatter_1 = require("../Formatter");
const Logger_1 = __importDefault(require("../Logger"));
const Npm = __importStar(require("../Npm"));
const ProjectVersions_1 = require("../ProjectVersions");
const VENDORING_PROVIDERS = {
    ios: () => require('../vendoring/IosVendoring'),
    android: () => require('../vendoring/AndroidVendoring'),
};
/**
 * Delegates vendoring process to platform's provider.
 */
async function vendorPlatformAsync(platform, sourceDirectory, targetDirectory, modulePlatformConfig) {
    var _a;
    const provider = (_a = VENDORING_PROVIDERS[platform]) === null || _a === void 0 ? void 0 : _a.call(VENDORING_PROVIDERS);
    if (!provider) {
        throw new Error(`No vendoring provider for platform "${platform}".`);
    }
    await provider.vendorAsync(sourceDirectory, targetDirectory, modulePlatformConfig);
}
exports.vendorPlatformAsync = vendorPlatformAsync;
/**
 * Outputs a table with modules, their versions and status.
 */
async function listAvailableVendoredModulesAsync(modules, onlyOutdated = false) {
    const bundledNativeModules = await ProjectVersions_1.getBundledVersionsAsync();
    const vendoredPackageNames = Object.keys(modules);
    const packageViews = await Promise.all(vendoredPackageNames.map((packageName) => Npm.getPackageViewAsync(packageName)));
    const table = new cli_table3_1.default({
        head: ['Package name', 'Bundled', 'Latest', 'Up to date'],
        colAligns: ['right', 'center', 'center', 'center'],
    });
    for (const packageName of vendoredPackageNames) {
        const packageView = packageViews.shift();
        if (!packageView) {
            Logger_1.default.error(`Couldn't get package view for ${chalk_1.default.green.bold(packageName)}.\n`);
            continue;
        }
        const bundledVersion = bundledNativeModules[packageName];
        const latestVersion = packageView['dist-tags'].latest;
        const isOutdated = !bundledVersion || semver_1.default.gtr(latestVersion, bundledVersion);
        if (!onlyOutdated || isOutdated) {
            const { source } = modules[packageName];
            table.push([
                Formatter_1.link(chalk_1.default.bold.green(packageName), source),
                (bundledVersion ? chalk_1.default.cyan : chalk_1.default.gray)(bundledVersion),
                chalk_1.default.cyan(latestVersion),
                isOutdated ? '❌' : '✅',
            ]);
        }
    }
    Logger_1.default.log(table.toString());
}
exports.listAvailableVendoredModulesAsync = listAvailableVendoredModulesAsync;
/**
 * Returns an array of platforms that vendoring process is available for.
 */
function getVendoringAvailablePlatforms() {
    return Object.keys(VENDORING_PROVIDERS);
}
exports.getVendoringAvailablePlatforms = getVendoringAvailablePlatforms;
//# sourceMappingURL=index.js.map