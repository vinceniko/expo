"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const semver_1 = __importDefault(require("semver"));
const Changelogs_1 = require("../Changelogs");
const Constants_1 = require("../Constants");
const Formatter_1 = require("../Formatter");
const Logger_1 = __importDefault(require("../Logger"));
const Packages_1 = require("../Packages");
const Utils_1 = require("../Utils");
const MAIN_CHANGELOG_PATH = path_1.default.join(Constants_1.EXPO_DIR, 'CHANGELOG.md');
const VERSIONS_FILE_PATH = path_1.default.join(Constants_1.EXPO_DIR, 'changelogVersions.json');
exports.default = (program) => {
    program
        .command('merge-changelogs')
        .alias('mc')
        .description('Merges packages changelogs into the root one.')
        .option('-c, --cut-off', 'Whether to cut off SDK changelog after merging. Works only without --sdk flag.')
        .asyncAction(async (options) => {
        const mainChangelog = new Changelogs_1.Changelog(MAIN_CHANGELOG_PATH);
        const changesMap = new Map();
        const versions = await json_file_1.default.readAsync(VERSIONS_FILE_PATH);
        const previousVersion = await mainChangelog.getLastPublishedVersionAsync();
        const nextVersion = semver_1.default.inc(previousVersion, 'major');
        if (!previousVersion) {
            throw new Error('Cannot find last published version in SDK changelog.');
        }
        // Versions object will be used to do cut-off. Make a new field for the next SDK in advance.
        versions[nextVersion] = { ...versions[previousVersion] };
        Logger_1.default.info('\n🤏 Getting a list of packages...');
        // Get public packages that are not explicitly set to `null` in `changelogVersions.json`.
        const packages = await Utils_1.filterAsync(await Packages_1.getListOfPackagesAsync(), async (pkg) => {
            var _a;
            return (!pkg.packageJson.private &&
                ((_a = versions[previousVersion]) === null || _a === void 0 ? void 0 : _a[pkg.packageName]) !== null &&
                (await pkg.hasChangelogAsync()));
        });
        // Load changes into `changesMap`.
        await getChangesFromPackagesAsync(packages, changesMap, versions, previousVersion);
        // Insert entries for packages not bundled in previous SDK.
        await insertInitialReleasesAsync(mainChangelog, changesMap, versions, previousVersion, nextVersion);
        // Insert updates from previously bundled packages.
        await insertNewChangelogEntriesAsync(mainChangelog, changesMap, versions, previousVersion, nextVersion);
        if (options.cutOff) {
            await cutOffMainChangelogAsync(mainChangelog, versions, nextVersion);
        }
        Logger_1.default.info('\n💾 Saving SDK changelog...');
        await mainChangelog.saveAsync();
        Logger_1.default.success('\n✅ Successfully merged changelog entries.');
    });
};
/**
 * Gets changes in packages changelogs as of the version bundled in previous SDK version.
 */
async function getChangesFromPackagesAsync(packages, changesMap, versions, previousVersion) {
    Logger_1.default.info('\n🔍 Gathering changelog entries from packages...');
    await Promise.all(packages.map(async (pkg) => {
        var _a;
        const changelog = new Changelogs_1.Changelog(pkg.changelogPath);
        const fromVersion = (_a = versions[previousVersion]) === null || _a === void 0 ? void 0 : _a[pkg.packageName];
        const changes = await changelog.getChangesAsync(fromVersion);
        if (changes.totalCount > 0) {
            changesMap.set(pkg, changes.versions);
        }
    }));
}
/**
 * Inserts initial package releases at the beginning of new features.
 */
async function insertInitialReleasesAsync(mainChangelog, changesMap, versions, previousVersion, nextVersion) {
    var _a;
    for (const pkg of changesMap.keys()) {
        // Get version of the package in previous SDK.
        const fromVersion = (_a = versions[previousVersion]) === null || _a === void 0 ? void 0 : _a[pkg.packageName];
        // The package wasn't bundled in SDK yet.
        if (!fromVersion) {
            // Delete the package from the map, no need to handle them again in further functions.
            changesMap.delete(pkg);
            if (!(await promptToMakeInitialReleaseAsync(pkg.packageName))) {
                continue;
            }
            // Update versions object with the local version.
            versions[nextVersion][pkg.packageName] = pkg.packageVersion;
            // Unshift initial release entry instead of grouped entries.
            await mainChangelog.insertEntriesAsync(Changelogs_1.UNPUBLISHED_VERSION_NAME, Changelogs_1.ChangeType.NEW_FEATURES, null, [`Initial release of **\`${pkg.packageName}\`** 🥳`], {
                unshift: true,
            });
            Logger_1.default.info(`\n📦 Inserted initial release of ${chalk_1.default.green(pkg.packageName)}`);
        }
    }
}
/**
 * Inserts new changelog entries made as of previous SDK.
 */
async function insertNewChangelogEntriesAsync(mainChangelog, changesMap, versions, previousVersion, nextVersion) {
    var _a;
    for (const [pkg, changes] of changesMap) {
        // Sort versions so we keep the order of changelog entries from oldest to newest.
        const packageVersions = Object.keys(changes).sort(sortVersionsAsc);
        // Get version of the package in previous SDK.
        const fromVersion = (_a = versions[previousVersion]) === null || _a === void 0 ? void 0 : _a[pkg.packageName];
        // Update versions object with the local version.
        versions[nextVersion][pkg.packageName] = pkg.packageVersion;
        const insertedEntries = {};
        let entriesCount = 0;
        for (const packageVersion of packageVersions) {
            for (const type in changes[packageVersion]) {
                const entries = await mainChangelog.insertEntriesAsync(Changelogs_1.UNPUBLISHED_VERSION_NAME, type, pkg.packageName, changes[packageVersion][type]);
                if (entries.length > 0) {
                    insertedEntries[type] = entries;
                    entriesCount += entries.length;
                }
            }
        }
        if (entriesCount === 0) {
            continue;
        }
        // Package was already bundled within previous version.
        Logger_1.default.info(`\n📦 Inserted ${chalk_1.default.green(pkg.packageName)} entries as of ${chalk_1.default.yellow(fromVersion)}`);
        for (const [type, entries] of Object.entries(insertedEntries)) {
            Logger_1.default.log('  ', chalk_1.default.magenta(Formatter_1.stripNonAsciiChars(type).trim() + ':'));
            entries.forEach((entry) => {
                Logger_1.default.log('    ', Formatter_1.formatChangelogEntry(entry.message));
            });
        }
    }
}
/**
 * Cuts off changelog for the new SDK and updates file with changelog versions.
 */
async function cutOffMainChangelogAsync(mainChangelog, versions, nextVersion) {
    Logger_1.default.info(`\n✂️  Cutting off changelog for SDK ${chalk_1.default.cyan(nextVersion)}...`);
    await mainChangelog.cutOffAsync(nextVersion, [
        Changelogs_1.ChangeType.LIBRARY_UPGRADES,
        Changelogs_1.ChangeType.BREAKING_CHANGES,
        Changelogs_1.ChangeType.NEW_FEATURES,
        Changelogs_1.ChangeType.BUG_FIXES,
    ]);
    Logger_1.default.info('\n💾 Saving new changelog versions...');
    // Create a new versions object with keys in descending order.
    const newVersions = Object.keys(versions)
        .sort((a, b) => sortVersionsAsc(b, a))
        .reduce((acc, version) => {
        acc[version] = versions[version];
        return acc;
    }, {});
    // Update `changelogVersions.json` with keys being sorted in descending order.
    await json_file_1.default.writeAsync(VERSIONS_FILE_PATH, newVersions);
}
/**
 * Comparator that sorts versions in ascending order with unpublished version being the last.
 */
function sortVersionsAsc(a, b) {
    return a === Changelogs_1.UNPUBLISHED_VERSION_NAME
        ? 1
        : b === Changelogs_1.UNPUBLISHED_VERSION_NAME
            ? -1
            : semver_1.default.compare(a, b);
}
/**
 * Prompts the user whether to make initial release of given package.
 */
async function promptToMakeInitialReleaseAsync(packageName) {
    Logger_1.default.log();
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            default: true,
            prefix: '❔',
            message: `${chalk_1.default.green(packageName)} wasn't bundled in SDK yet. Do you want to include it?`,
        },
    ]);
    return confirm;
}
//# sourceMappingURL=MergeChangelogs.js.map