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
exports.updateWorkspaceProjects = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../../Constants");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Workspace = __importStar(require("../../Workspace"));
const { green, yellow, cyan } = chalk_1.default;
/**
 * Updates versions of packages to be published in other workspace projects depending on them.
 */
exports.updateWorkspaceProjects = new TasksRunner_1.Task({
    name: 'updateWorkspaceProjects',
    filesToStage: ['**/package.json', 'yarn.lock'],
}, async (parcels) => {
    Logger_1.default.info('\n📤 Updating workspace projects...');
    const workspaceInfo = await Workspace.getInfoAsync();
    const dependenciesKeys = ['dependencies', 'devDependencies', 'peerDependencies'];
    const parcelsObject = parcels.reduce((acc, parcel) => {
        acc[parcel.pkg.packageName] = parcel;
        return acc;
    }, {});
    await Promise.all(Object.entries(workspaceInfo).map(async ([projectName, projectInfo]) => {
        const projectDependencies = [
            ...projectInfo.workspaceDependencies,
            ...projectInfo.mismatchedWorkspaceDependencies,
        ]
            .map((dependencyName) => parcelsObject[dependencyName])
            .filter(Boolean);
        // If this project doesn't depend on any package we're going to publish.
        if (projectDependencies.length === 0) {
            return;
        }
        // Get copy of project's `package.json`.
        const projectPackageJsonPath = path_1.default.join(Constants_1.EXPO_DIR, projectInfo.location, 'package.json');
        const projectPackageJson = await json_file_1.default.readAsync(projectPackageJsonPath);
        const batch = Logger_1.default.batch();
        batch.log('  ', green(projectName));
        // Iterate through different dependencies types.
        for (const dependenciesKey of dependenciesKeys) {
            const dependenciesObject = projectPackageJson[dependenciesKey];
            if (!dependenciesObject) {
                continue;
            }
            for (const { pkg, state } of projectDependencies) {
                const currentVersionRange = dependenciesObject[pkg.packageName];
                if (!currentVersionRange) {
                    continue;
                }
                // Leave tilde and caret as they are, just replace the version.
                const newVersionRange = currentVersionRange.replace(/([\^~]?).*/, `$1${state.releaseVersion}`);
                dependenciesObject[pkg.packageName] = newVersionRange;
                batch.log('    ', `Updating ${yellow(`${dependenciesKey}.${pkg.packageName}`)}`, `from ${cyan(currentVersionRange)} to ${cyan(newVersionRange)}`);
            }
        }
        // Save project's `package.json`.
        await json_file_1.default.writeAsync(projectPackageJsonPath, projectPackageJson);
        // Flush batched logs.
        batch.flush();
    }));
});
//# sourceMappingURL=updateWorkspaceProjects.js.map