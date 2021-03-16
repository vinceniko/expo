"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const perf_hooks_1 = require("perf_hooks");
const Logger_1 = __importDefault(require("../Logger"));
const Packages_1 = require("../Packages");
const XcodeProject_1 = __importDefault(require("../prebuilds/XcodeProject"));
const Prebuilder_1 = require("../prebuilds/Prebuilder");
async function main(packageNames, options) {
    const filteredPackageNames = packageNames.length > 0
        ? packageNames.filter((name) => Prebuilder_1.PACKAGES_TO_PREBUILD.includes(name))
        : Prebuilder_1.PACKAGES_TO_PREBUILD;
    if (options.cleanCache) {
        Logger_1.default.info('🧹 Cleaning shared derived data directory');
        await XcodeProject_1.default.cleanBuildFolderAsync();
    }
    const packages = filteredPackageNames.map(Packages_1.getPackageByName).filter(Boolean);
    if (options.removeArtifacts) {
        Logger_1.default.info('🧹 Removing existing artifacts');
        await Prebuilder_1.cleanFrameworksAsync(packages);
        // Stop here, it doesn't make much sense to build them again ;)
        return;
    }
    for (const pkg of packages) {
        Logger_1.default.info(`📦 Prebuilding ${chalk_1.default.green(pkg.packageName)}`);
        const startTime = perf_hooks_1.performance.now();
        const xcodeProject = await Prebuilder_1.generateXcodeProjectSpecAsync(pkg);
        if (!options.generateSpecs) {
            await Prebuilder_1.buildFrameworksForProjectAsync(xcodeProject);
            await Prebuilder_1.cleanTemporaryFilesAsync(xcodeProject);
        }
        const endTime = perf_hooks_1.performance.now();
        const timeDiff = (endTime - startTime) / 1000;
        Logger_1.default.success('   Finished in: %s\n', chalk_1.default.magenta(timeDiff.toFixed(2) + 's'));
    }
}
exports.default = (program) => {
    program
        .command('prebuild-packages [packageNames...]')
        .alias('prebuild')
        .option('-r, --remove-artifacts', 'Removes `.xcframework` artifacts for given packages.', false)
        .option('-c, --clean-cache', 'Cleans the shared derived data folder before prebuilding.', false)
        .option('-g, --generate-specs', 'Only generates project specs', false)
        .asyncAction(main);
};
//# sourceMappingURL=PrebuildPackages.js.map