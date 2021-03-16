"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseType = void 0;
/**
 * Enum of possible release types. It must be in sync with `semver.ReleaseType` union options.
 */
var ReleaseType;
(function (ReleaseType) {
    ReleaseType["MAJOR"] = "major";
    ReleaseType["MINOR"] = "minor";
    ReleaseType["PATCH"] = "patch";
    ReleaseType["PREMAJOR"] = "premajor";
    ReleaseType["PREMINOR"] = "preminor";
    ReleaseType["PREPATCH"] = "prepatch";
    ReleaseType["PRERELEASE"] = "prerelease";
})(ReleaseType = exports.ReleaseType || (exports.ReleaseType = {}));
//# sourceMappingURL=types.js.map