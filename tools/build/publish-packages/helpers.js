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
exports.printPackageParcel = exports.shouldUseBackupAsync = exports.pickBackupableOptions = void 0;
const chalk_1 = __importDefault(require("chalk"));
const lodash_1 = require("lodash");
const inquirer_1 = __importDefault(require("inquirer"));
const Formatter = __importStar(require("../Formatter"));
const Logger_1 = __importDefault(require("../Logger"));
const constants_1 = require("./constants");
const Changelogs_1 = require("../Changelogs");
const { green, cyan, magenta, gray } = chalk_1.default;
/**
 * Returns options that are capable of being backed up.
 * We will need just a few options to determine whether the backup is valid
 * and we can't pass them all because `options` is in fact commander's `Command` instance.
 */
function pickBackupableOptions(options) {
    return lodash_1.pick(options, constants_1.BACKUPABLE_OPTIONS_FIELDS);
}
exports.pickBackupableOptions = pickBackupableOptions;
/**
 * Whether tasks backup can be used to retry previous command invocation.
 */
async function shouldUseBackupAsync(options) {
    if (process.env.CI) {
        return false;
    }
    if (options.retry) {
        return true;
    }
    const { restore } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'restore',
            prefix: '❔',
            message: cyan('Found valid backup file. Would you like to use it?'),
        },
    ]);
    Logger_1.default.log();
    return restore;
}
exports.shouldUseBackupAsync = shouldUseBackupAsync;
/**
 * Prints gathered crucial informations about the package.
 */
function printPackageParcel(parcel) {
    var _a;
    const { pkg, pkgView, state, dependencies } = parcel;
    const { logs, changelogChanges, releaseType, releaseVersion } = state;
    const gitHead = pkgView === null || pkgView === void 0 ? void 0 : pkgView.gitHead;
    Logger_1.default.log('\n📦', `${green.bold(pkg.packageName)},`, `current version ${cyan.bold(pkg.packageVersion)},`, pkgView ? `published from ${Formatter.formatCommitHash(gitHead)}` : 'not published yet');
    if (!pkgView) {
        Logger_1.default.log('  ', magenta(`Version ${cyan.bold(pkg.packageVersion)} hasn't been published yet.`));
    }
    else if (!logs) {
        Logger_1.default.warn("   We couldn't determine new commits for this package.");
        if (gitHead) {
            // There are no logs and `gitHead` is there, so probably it's unreachable.
            Logger_1.default.warn('   Git head of its current version is not reachable from this branch.');
        }
        else {
            Logger_1.default.warn("   It doesn't seem to be published by this script yet.");
        }
    }
    if (dependencies.length) {
        Logger_1.default.log('  ', magenta('Package depends on:'));
        dependencies.forEach((dependency) => {
            Logger_1.default.log('    ', green(dependency.pkg.packageName), gray(`(requires ${cyan(dependency.state.releaseType)} upgrade)`));
        });
    }
    if (logs && logs.commits.length > 0) {
        Logger_1.default.log('  ', magenta('New commits:'));
        [...logs.commits].reverse().forEach((commitLog) => {
            Logger_1.default.log('    ', Formatter.formatCommitLog(commitLog));
        });
    }
    if (logs && logs.files.length > 0) {
        Logger_1.default.log('  ', magenta('File changes:'), gray('(build folder not displayed)'));
        logs.files.forEach((fileLog) => {
            if (fileLog.relativePath.startsWith('build/')) {
                return;
            }
            Logger_1.default.log('    ', Formatter.formatFileLog(fileLog));
        });
    }
    const unpublishedChanges = (_a = changelogChanges === null || changelogChanges === void 0 ? void 0 : changelogChanges.versions[Changelogs_1.UNPUBLISHED_VERSION_NAME]) !== null && _a !== void 0 ? _a : {};
    for (const changeType in unpublishedChanges) {
        const changes = unpublishedChanges[changeType];
        if (changes.length > 0) {
            Logger_1.default.log('  ', magenta(`${Formatter.stripNonAsciiChars(changeType).trim()}:`));
            for (const change of unpublishedChanges[changeType]) {
                Logger_1.default.log('    ', Formatter.formatChangelogEntry(change.message));
            }
        }
    }
    if (pkgView && releaseType && releaseVersion) {
        Logger_1.default.log('  ', magenta(`Suggested ${cyan.bold(releaseType)} upgrade to ${cyan.bold(releaseVersion)}`));
    }
}
exports.printPackageParcel = printPackageParcel;
//# sourceMappingURL=helpers.js.map