"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.podInstallAsync = exports.readPodspecAsync = void 0;
const Utils_1 = require("./Utils");
/**
 * Reads the podspec and returns it in JSON format.
 */
async function readPodspecAsync(podspecPath) {
    return await Utils_1.spawnJSONCommandAsync('pod', ['ipc', 'spec', podspecPath]);
}
exports.readPodspecAsync = readPodspecAsync;
/**
 * Installs pods under given project path.
 */
async function podInstallAsync(projectPath, options = { noRepoUpdate: false, stdio: 'pipe' }) {
    var _a;
    const args = ['install'];
    if (options.noRepoUpdate) {
        args.push('--no-repo-update');
    }
    await Utils_1.spawnAsync('pod', args, {
        cwd: projectPath,
        stdio: (_a = options.stdio) !== null && _a !== void 0 ? _a : 'pipe',
    });
}
exports.podInstallAsync = podInstallAsync;
//# sourceMappingURL=CocoaPods.js.map