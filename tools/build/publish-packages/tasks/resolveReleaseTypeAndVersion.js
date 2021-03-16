"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReleaseTypeAndVersion = void 0;
const semver_1 = __importDefault(require("semver"));
const TasksRunner_1 = require("../../TasksRunner");
const types_1 = require("../types");
const findUnpublished_1 = require("./findUnpublished");
const RELEASE_TYPES_ASC_ORDER = [types_1.ReleaseType.PATCH, types_1.ReleaseType.MINOR, types_1.ReleaseType.MAJOR];
/**
 * Resolves parcel's release type and version, based on its `minReleaseType` and its dependencies.
 */
exports.resolveReleaseTypeAndVersion = new TasksRunner_1.Task({
    name: 'resolveReleaseTypeAndVersion',
    dependsOn: [findUnpublished_1.findUnpublished],
}, async (parcels, options) => {
    var _a;
    const prerelease = options.prerelease === true ? 'rc' : options.prerelease || undefined;
    for (const parcel of parcels) {
        const { pkg, pkgView, state } = parcel;
        // Find the highest release type among parcel's dependencies.
        const accumulatedTypes = recursivelyAccumulateReleaseTypes(parcel);
        const highestReleaseType = [...accumulatedTypes].reduce(highestReleaseTypeReducer, types_1.ReleaseType.PATCH);
        // Make it a prerelease version if `--prerelease` was passed and assign to the state.
        state.releaseType = prerelease
            ? ('pre' + highestReleaseType)
            : highestReleaseType;
        // Calculate version to should bump to.
        state.releaseVersion = resolveSuggestedVersion(pkg.packageVersion, (_a = pkgView === null || pkgView === void 0 ? void 0 : pkgView.versions) !== null && _a !== void 0 ? _a : [], state.releaseType, prerelease);
    }
});
/**
 * Returns suggested version based on given current version, already published versions and suggested release type.
 */
function resolveSuggestedVersion(versionToBump, otherVersions, releaseType, prereleaseIdentifier) {
    // If the version to bump is not published yet, then we do want to use it instead,
    // no matter which release type is suggested.
    // TODO: do we need to make an exception for prerelease versions?
    if (!otherVersions.includes(versionToBump) && semver_1.default.valid(versionToBump)) {
        return versionToBump;
    }
    const targetPrereleaseIdentifier = prereleaseIdentifier !== null && prereleaseIdentifier !== void 0 ? prereleaseIdentifier : getPrereleaseIdentifier(versionToBump);
    // Higher version might have already been published from another place,
    // so get the highest published version that satisfies release type.
    const highestSatisfyingVersion = otherVersions
        .filter((version) => {
        return (semver_1.default.gt(version, versionToBump) &&
            semver_1.default.diff(version, versionToBump) === releaseType &&
            getPrereleaseIdentifier(version) === targetPrereleaseIdentifier);
    })
        .sort(semver_1.default.rcompare)[0];
    return semver_1.default.inc(highestSatisfyingVersion !== null && highestSatisfyingVersion !== void 0 ? highestSatisfyingVersion : versionToBump, releaseType, targetPrereleaseIdentifier);
}
/**
 * Accumulates all `minReleaseType` in given parcel and all its dependencies.
 */
function recursivelyAccumulateReleaseTypes(parcel, set = new Set()) {
    if (parcel.state.minReleaseType) {
        set.add(parcel.state.minReleaseType);
    }
    for (const dependency of parcel.dependencies) {
        recursivelyAccumulateReleaseTypes(dependency, set);
    }
    return set;
}
/**
 * Used as a reducer to find the highest release type.
 */
function highestReleaseTypeReducer(a, b) {
    const ai = RELEASE_TYPES_ASC_ORDER.indexOf(a);
    const bi = RELEASE_TYPES_ASC_ORDER.indexOf(b);
    return bi > ai ? b : a;
}
/**
 * Returns prerelease identifier of given version or `null` if given version is not a prerelease version.
 * `semver.prerelease` returns an array of prerelease parts (`1.0.0-beta.0` results in `['beta', 0]`),
 * however we just need the identifier.
 */
function getPrereleaseIdentifier(version) {
    const prerelease = semver_1.default.prerelease(version);
    return Array.isArray(prerelease) && typeof prerelease[0] === 'string' ? prerelease[0] : null;
}
//# sourceMappingURL=resolveReleaseTypeAndVersion.js.map