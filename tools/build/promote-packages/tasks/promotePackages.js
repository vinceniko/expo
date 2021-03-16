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
exports.promotePackages = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const Npm = __importStar(require("../../Npm"));
const TasksRunner_1 = require("../../TasksRunner");
const helpers_1 = require("../helpers");
const findPackagesToPromote_1 = require("./findPackagesToPromote");
const prepareParcels_1 = require("./prepareParcels");
const selectPackagesToPromote_1 = require("./selectPackagesToPromote");
const { yellow, red, green, cyan } = chalk_1.default;
/**
 * Promotes local versions of selected packages to npm tag passed as an option.
 */
exports.promotePackages = new TasksRunner_1.Task({
    name: 'promotePackages',
    dependsOn: [prepareParcels_1.prepareParcels, findPackagesToPromote_1.findPackagesToPromote, selectPackagesToPromote_1.selectPackagesToPromote],
}, async (parcels, options) => {
    Logger_1.default.info(`\n🚀 Promoting packages to ${yellow.bold(options.tag)} tag...`);
    await Promise.all(parcels.map(async ({ pkg, state }) => {
        const currentVersion = pkg.packageVersion;
        const { versionToReplace } = state;
        const batch = Logger_1.default.batch();
        const action = state.isDemoting ? red('Demoting') : green('Promoting');
        batch.log('  ', green.bold(pkg.packageName));
        batch.log('    ', action, yellow(options.tag), helpers_1.formatVersionChange(versionToReplace, currentVersion));
        // Tag the local version of the package.
        if (!options.dry) {
            await Npm.addTagAsync(pkg.packageName, pkg.packageVersion, options.tag);
        }
        // If the local version had any tags assigned, we can drop the old ones.
        if (options.drop && state.distTags && !state.distTags.includes(options.tag)) {
            for (const distTag of state.distTags) {
                batch.log('    ', `Dropping ${yellow(distTag)} tag (${cyan(currentVersion)})...`);
                if (!options.dry) {
                    await Npm.removeTagAsync(pkg.packageName, distTag);
                }
            }
        }
        batch.flush();
    }));
    Logger_1.default.success(`\n✅ Successfully promoted ${cyan(parcels.length + '')} packages.`);
});
//# sourceMappingURL=promotePackages.js.map