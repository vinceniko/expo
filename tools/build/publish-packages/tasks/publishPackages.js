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
exports.publishPackages = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const Git_1 = __importDefault(require("../../Git"));
const Npm = __importStar(require("../../Npm"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const resolveReleaseTypeAndVersion_1 = require("./resolveReleaseTypeAndVersion");
const { green, cyan, yellow } = chalk_1.default;
/**
 * Publishes all packages that have been selected to publish.
 */
exports.publishPackages = new TasksRunner_1.Task({
    name: 'publishPackages',
    dependsOn: [resolveReleaseTypeAndVersion_1.resolveReleaseTypeAndVersion],
}, async (parcels, options) => {
    Logger_1.default.info('\n🚀 Publishing packages...');
    const gitHead = await Git_1.default.getHeadCommitHashAsync();
    for (const { pkg, state } of parcels) {
        const packageJsonPath = path_1.default.join(pkg.path, 'package.json');
        Logger_1.default.log('  ', `${green(pkg.packageName)} version ${cyan(state.releaseVersion)} as ${yellow(options.tag)}`);
        // Update `gitHead` property so it will be available to read using `npm view --json`.
        // Next publish will depend on this to properly get changes made after that.
        await json_file_1.default.setAsync(packageJsonPath, 'gitHead', gitHead);
        // Publish the package.
        await Npm.publishPackageAsync(pkg.path, options.tag, options.dry);
        // Delete `gitHead` from `package.json` – no need to clutter it.
        await json_file_1.default.deleteKeyAsync(packageJsonPath, 'gitHead');
        state.published = true;
    }
});
//# sourceMappingURL=publishPackages.js.map