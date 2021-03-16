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
exports.findUnpublished = void 0;
const npm_packlist_1 = __importDefault(require("npm-packlist"));
const Changelogs = __importStar(require("../../Changelogs"));
const Git_1 = require("../../Git");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Utils_1 = require("../../Utils");
const prepareParcels_1 = require("./prepareParcels");
const types_1 = require("../types");
/**
 * An array of directories treated as containing native code.
 */
const NATIVE_DIRECTORIES = ['ios', 'android', 'cpp'];
/**
 * Finds unpublished packages. Package is considered unpublished if there are
 * any new commits or changelog entries prior to previous publish on the current branch.
 */
exports.findUnpublished = new TasksRunner_1.Task({
    name: 'findUnpublished',
    dependsOn: [prepareParcels_1.prepareParcels],
}, async (parcels, options) => {
    Logger_1.default.info('\n👀 Searching for packages with unpublished changes...');
    const newParcels = await Utils_1.filterAsync(parcels, async (parcel) => {
        const { pkgView, changelog, gitDir, state } = parcel;
        const changelogChanges = await changelog.getChangesAsync();
        const logs = await getPackageGitLogsAsync(gitDir, pkgView === null || pkgView === void 0 ? void 0 : pkgView.gitHead);
        state.logs = logs;
        state.changelogChanges = changelogChanges;
        state.minReleaseType = await getMinReleaseTypeAsync(parcel);
        // Return whether the package has any unpublished changes or git logs couldn't be obtained.
        return !logs || logs.files.length > 0 || changelogChanges.totalCount > 0;
    });
    if (newParcels.length === 0) {
        Logger_1.default.success('\n✅ All packages are up-to-date.');
        return TasksRunner_1.Task.STOP;
    }
    return [newParcels, options];
});
/**
 * Gets lists of commits and files changed under given directory and since commit with given checksum.
 * Returned files list is filtered out from files ignored by npm when it creates package's tarball.
 * Can return `null` if given commit is not an ancestor of head commit.
 */
async function getPackageGitLogsAsync(gitDir, fromCommit) {
    var _a;
    if (!fromCommit || !(await gitDir.isAncestorAsync(fromCommit))) {
        return null;
    }
    const commits = await gitDir.logAsync({
        fromCommit,
        toCommit: 'head',
    });
    const gitFiles = await gitDir.logFilesAsync({
        fromCommit,
        toCommit: (_a = commits[0]) === null || _a === void 0 ? void 0 : _a.hash,
    });
    // Get an array of relative paths to files that will be shipped with the package.
    const packlist = await npm_packlist_1.default({ path: gitDir.path });
    // Filter git files to contain only deleted or "packlisted" files.
    const files = gitFiles.filter((file) => file.status === Git_1.GitFileStatus.D || packlist.includes(file.relativePath));
    return {
        commits,
        files,
    };
}
/**
 * Returns minimum release type for given parcel (doesn't take dependencies into account).
 */
async function getMinReleaseTypeAsync(parcel) {
    var _a, _b;
    const { logs, changelogChanges } = parcel.state;
    const unpublishedChanges = changelogChanges === null || changelogChanges === void 0 ? void 0 : changelogChanges.versions[Changelogs.UNPUBLISHED_VERSION_NAME];
    const hasBreakingChanges = (_a = unpublishedChanges === null || unpublishedChanges === void 0 ? void 0 : unpublishedChanges[Changelogs.ChangeType.BREAKING_CHANGES]) === null || _a === void 0 ? void 0 : _a.length;
    const hasNewFeatures = (_b = unpublishedChanges === null || unpublishedChanges === void 0 ? void 0 : unpublishedChanges[Changelogs.ChangeType.NEW_FEATURES]) === null || _b === void 0 ? void 0 : _b.length;
    // For breaking changes and new features we follow semver.
    if (hasBreakingChanges) {
        return types_1.ReleaseType.MAJOR;
    }
    if (hasNewFeatures) {
        return types_1.ReleaseType.MINOR;
    }
    // If the package is a native module, then we have to check whether there are any native changes.
    if (await parcel.pkg.isNativeModuleAsync()) {
        const hasNativeChanges = logs && fileLogsContainNativeChanges(logs.files);
        return hasNativeChanges ? types_1.ReleaseType.MINOR : types_1.ReleaseType.PATCH;
    }
    return types_1.ReleaseType.PATCH;
}
/**
 * Determines whether git file logs contain any changes in directories with native code.
 */
function fileLogsContainNativeChanges(fileLogs) {
    return fileLogs.some((fileLog) => {
        return NATIVE_DIRECTORIES.some((dir) => fileLog.relativePath.startsWith(`${dir}/`));
    });
}
//# sourceMappingURL=findUnpublished.js.map