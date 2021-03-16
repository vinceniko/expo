"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDependencyAsync = exports.getNativeApps = exports.installAsync = exports.getInfoAsync = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const path_1 = __importDefault(require("path"));
const Packages_1 = require("./Packages");
const Utils_1 = require("./Utils");
const Constants_1 = require("./Constants");
const NATIVE_APPS_PATHS = [Constants_1.EXPO_DIR, path_1.default.join(Constants_1.EXPO_DIR, 'apps/bare-expo')];
/**
 * Returns an object containing info for all projects in the workspace.
 */
async function getInfoAsync() {
    const info = await Utils_1.spawnJSONCommandAsync('yarn', [
        '--json',
        'workspaces',
        'info',
    ]);
    return JSON.parse(info.data);
}
exports.getInfoAsync = getInfoAsync;
/**
 * Runs yarn in the root workspace directory.
 */
async function installAsync() {
    await Utils_1.spawnAsync('yarn');
}
exports.installAsync = installAsync;
/**
 * Returns an array of workspace's native apps, like Expo Client or BareExpo.
 */
function getNativeApps() {
    return NATIVE_APPS_PATHS.map((appPath) => new Packages_1.Package(appPath));
}
exports.getNativeApps = getNativeApps;
/**
 * Updates the dependency across all workspace projects to given version range.
 */
async function updateDependencyAsync(dependencyName, versionRange) {
    const projectLocations = Object.values(await getInfoAsync()).map((projectInfo) => projectInfo.location);
    await Promise.all(projectLocations.map(async (location) => {
        const jsonFile = new json_file_1.default(path_1.default.join(Constants_1.EXPO_DIR, location, 'package.json'));
        const packageJson = await jsonFile.readAsync();
        for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies']) {
            const dependencies = packageJson[dependencyType];
            const currentVersion = dependencies === null || dependencies === void 0 ? void 0 : dependencies[dependencyName];
            if (dependencies && currentVersion && currentVersion !== '*') {
                dependencies[dependencyName] = versionRange;
            }
        }
        await jsonFile.writeAsync(packageJson);
    }));
}
exports.updateDependencyAsync = updateDependencyAsync;
//# sourceMappingURL=Workspace.js.map