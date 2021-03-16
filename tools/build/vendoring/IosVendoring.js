"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_promise_1 = __importDefault(require("glob-promise"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const CocoaPods_1 = require("../CocoaPods");
const Constants_1 = require("../Constants");
const Logger_1 = __importDefault(require("../Logger"));
const Utils_1 = require("../Utils");
const common_1 = require("./common");
async function vendorAsync(sourceDirectory, targetDirectory, config = {}) {
    var _a, _b, _c, _d, _e;
    const [podspecFile] = await glob_promise_1.default('**/*.podspec', {
        cwd: sourceDirectory,
    });
    if (!podspecFile) {
        throw new Error('Missing `*.podspec` file!');
    }
    const podspec = await CocoaPods_1.readPodspecAsync(path_1.default.join(sourceDirectory, podspecFile));
    // Get a list of source files specified by the podspec.
    const filesPatterns = [].concat(podspec.source_files, (_b = (_a = podspec.ios) === null || _a === void 0 ? void 0 : _a.source_files) !== null && _b !== void 0 ? _b : [], (_c = podspec.preserve_paths) !== null && _c !== void 0 ? _c : []);
    const files = await Utils_1.searchFilesAsync(sourceDirectory, filesPatterns);
    await common_1.copyVendoredFilesAsync(files, {
        sourceDirectory,
        targetDirectory,
        transforms: (_d = config === null || config === void 0 ? void 0 : config.transforms) !== null && _d !== void 0 ? _d : {},
    });
    // We may need to transform the podspec as well. As we have an access to its JSON representation,
    // it seems better to modify the object directly instead of string-transforming.
    (_e = config.mutatePodspec) === null || _e === void 0 ? void 0 : _e.call(config, podspec);
    // Save the dynamic ruby podspec as a static JSON file, so there is no need
    // to copy `package.json` files, which are often being read by the podspecs.
    const podspecJsonFile = podspecFile + '.json';
    await fs_extra_1.default.outputJSON(path_1.default.join(targetDirectory, podspecJsonFile), podspec, {
        spaces: 2,
    });
    Logger_1.default.log('📄 Generating %s', chalk_1.default.magenta(podspecJsonFile));
    if (await promptToReinstallPodsAsync()) {
        Logger_1.default.log('♻️  Reinstalling pods at %s', chalk_1.default.magenta(Constants_1.IOS_DIR));
        await CocoaPods_1.podInstallAsync(Constants_1.IOS_DIR, {
            noRepoUpdate: true,
        });
    }
}
exports.vendorAsync = vendorAsync;
/**
 * Asks whether to reinstall pods.
 */
async function promptToReinstallPodsAsync() {
    if (!process.env.CI) {
        return true;
    }
    const { reinstall } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'reinstall',
            prefix: '❔',
            message: 'Do you want to reinstall pods?',
        },
    ]);
    return reinstall;
}
//# sourceMappingURL=IosVendoring.js.map