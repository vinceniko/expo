"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPackagesIntegrity = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const Logger_1 = __importDefault(require("../../Logger"));
const Git_1 = __importDefault(require("../../Git"));
const TasksRunner_1 = require("../../TasksRunner");
const prepareParcels_1 = require("./prepareParcels");
const { green, cyan, blue, yellow } = chalk_1.default;
/**
 * Checks packages integrity and warns about violations.
 * Integrity is violated if the current version of a package:
 * - has no `gitHead` property in its package view.
 * - commit to which `gitHead` refers is not an ancestor of the current head commit.
 * - mismatches last version found in changelog.
 */
exports.checkPackagesIntegrity = new TasksRunner_1.Task({
    name: 'checkPackagesIntegrity',
    dependsOn: [prepareParcels_1.prepareParcels],
}, async (parcels, options) => {
    Logger_1.default.info('\n👁  Checking packages integrity...');
    const resolver = async ({ pkg, pkgView, changelog }) => {
        if (!pkgView) {
            // If package view is not there, then the package hasn't been released yet - no need to check integrity.
            return true;
        }
        const isAncestor = !!pkgView.gitHead && (await Git_1.default.isAncestorAsync(pkgView.gitHead));
        const lastChangelogVersion = await changelog.getLastPublishedVersionAsync();
        const isVersionMatching = !lastChangelogVersion || pkgView.version === lastChangelogVersion;
        const integral = isAncestor && isVersionMatching;
        if (!integral) {
            Logger_1.default.warn(`\n⚠️  Integrity checks failed for ${green(pkg.packageName)}.`);
        }
        if (!pkgView.gitHead) {
            Logger_1.default.warn(`   Cannot find ${blue('gitHead')} in package view.`);
        }
        else if (!isAncestor) {
            Logger_1.default.warn(`   Local version ${cyan(pkgView.version)} has been published from different branch.`);
        }
        if (!isVersionMatching) {
            Logger_1.default.warn(`   Last version in changelog ${cyan(lastChangelogVersion)}`, `doesn't match local version ${cyan(pkgView.version)}.`);
        }
        return integral;
    };
    const results = await Promise.all(parcels.map(resolver));
    const somethingFailed = results.some((result) => !result);
    if (options.checkIntegrity) {
        if (somethingFailed) {
            Logger_1.default.error('\n🚫 Integrity checks failed.');
        }
        else {
            Logger_1.default.success('\n✅ All integrity checks passed.');
        }
        return;
    }
    if (somethingFailed && (await shouldStopOnFailedIntegrityChecksAsync())) {
        if (process.env.CI) {
            throw new Error('Some integrity checks failed – it is prohibited on the CI.');
        }
        return TasksRunner_1.Task.STOP;
    }
});
/**
 * Resolves to a boolean value that means whether to stop the workflow if some integrity checks have failed.
 * It immediately returns `true` if it's run on the CI.
 */
async function shouldStopOnFailedIntegrityChecksAsync() {
    if (process.env.CI) {
        return true;
    }
    const { proceed } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            prefix: '❔',
            message: yellow('Some integrity checks have failed. Do you want to proceed either way?'),
            default: true,
        },
    ]);
    return !proceed;
}
//# sourceMappingURL=checkPackagesIntegrity.js.map