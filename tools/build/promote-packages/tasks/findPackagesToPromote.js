"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPackagesToPromote = void 0;
const semver_1 = __importDefault(require("semver"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
/**
 * Finds packages whose local version is not tagged as the target tag provided as a command option (defaults to `latest`).
 */
exports.findPackagesToPromote = new TasksRunner_1.Task({
    name: 'findPackagesToPromote',
}, async (parcels, options) => {
    Logger_1.default.info('\n👀 Searching for packages to promote...');
    const newParcels = [];
    await Promise.all(parcels.map(async (parcel) => {
        var _a, _b;
        const { pkg, pkgView, state } = parcel;
        const currentDistTags = await pkg.getDistTagsAsync();
        const versionToReplace = (_b = (_a = pkgView === null || pkgView === void 0 ? void 0 : pkgView['dist-tags']) === null || _a === void 0 ? void 0 : _a[options.tag]) !== null && _b !== void 0 ? _b : null;
        const canPromote = pkgView && !currentDistTags.includes(options.tag);
        state.distTags = currentDistTags;
        state.versionToReplace = versionToReplace;
        state.isDemoting = !!versionToReplace && semver_1.default.lt(pkg.packageVersion, versionToReplace);
        if (canPromote && (!state.isDemoting || options.list || options.demote)) {
            newParcels.push(parcel);
        }
    }));
    if (newParcels.length === 0) {
        Logger_1.default.success('\n✅ No packages to promote.\n');
        return TasksRunner_1.Task.STOP;
    }
    return [newParcels, options];
});
//# sourceMappingURL=findPackagesToPromote.js.map