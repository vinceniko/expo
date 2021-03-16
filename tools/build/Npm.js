"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoamiAsync = exports.grantReadWriteAccessAsync = exports.getTeamMembersAsync = exports.removeTagAsync = exports.addTagAsync = exports.publishPackageAsync = exports.getPackageViewAsync = exports.EXPO_DEVELOPERS_TEAM_NAME = void 0;
const Utils_1 = require("./Utils");
exports.EXPO_DEVELOPERS_TEAM_NAME = 'expo:developers';
/**
 * Runs `npm view` for package with given name. Returns null if package is not published yet.
 */
async function getPackageViewAsync(packageName, version) {
    try {
        return await Utils_1.spawnJSONCommandAsync('npm', [
            'view',
            version ? `${packageName}@${version}` : packageName,
            '--json',
        ]);
    }
    catch (error) {
        return null;
    }
}
exports.getPackageViewAsync = getPackageViewAsync;
/**
 * Publishes a package at given directory to the global npm registry.
 */
async function publishPackageAsync(packageDir, tagName = 'latest', dryRun = false) {
    const args = ['publish', '--tag', tagName, '--access', 'public'];
    if (dryRun) {
        args.push('--dry-run');
    }
    await Utils_1.spawnAsync('npm', args, {
        cwd: packageDir,
    });
}
exports.publishPackageAsync = publishPackageAsync;
/**
 * Adds dist-tag to a specific version of the package.
 */
async function addTagAsync(packageName, version, tagName) {
    await Utils_1.spawnAsync('npm', ['dist-tag', 'add', `${packageName}@${version}`, tagName]);
}
exports.addTagAsync = addTagAsync;
/**
 * Removes package's tag with given name.
 */
async function removeTagAsync(packageName, tagName) {
    await Utils_1.spawnAsync('npm', ['dist-tag', 'rm', packageName, tagName]);
}
exports.removeTagAsync = removeTagAsync;
/**
 * Gets a list of user names in the team with given team name.
 */
async function getTeamMembersAsync(teamName) {
    return await Utils_1.spawnJSONCommandAsync('npm', ['team', 'ls', teamName, '--json']);
}
exports.getTeamMembersAsync = getTeamMembersAsync;
/**
 * Adds a package to organization team granting access to everyone in the team.
 */
async function grantReadWriteAccessAsync(packageName, teamName) {
    await Utils_1.spawnAsync('npm', ['access', 'grant', 'read-write', teamName, packageName]);
}
exports.grantReadWriteAccessAsync = grantReadWriteAccessAsync;
/**
 * Returns a name of the currently logged in user or `null` if logged out.
 */
async function whoamiAsync() {
    try {
        const { stdout } = await Utils_1.spawnAsync('npm', ['whoami']);
        return stdout.trim();
    }
    catch (e) {
        return null;
    }
}
exports.whoamiAsync = whoamiAsync;
//# sourceMappingURL=Npm.js.map