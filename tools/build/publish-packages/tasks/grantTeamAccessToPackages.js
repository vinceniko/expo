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
exports.grantTeamAccessToPackages = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const Npm = __importStar(require("../../Npm"));
const TasksRunner_1 = require("../../TasksRunner");
const prepareParcels_1 = require("./prepareParcels");
const { green } = chalk_1.default;
/**
 * Grants package access to the whole team. Applies only when the package
 * wasn't published before or someone from the team is not included in maintainers list.
 */
exports.grantTeamAccessToPackages = new TasksRunner_1.Task({
    name: 'grantTeamAccessToPackages',
    dependsOn: [prepareParcels_1.prepareParcels],
}, async (parcels, options) => {
    // There is no good way to check whether the package is added to organization team,
    // so let's get all team members and check if they all are declared as maintainers.
    // If they don't, grant access for the team.
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);
    const packagesToGrantAccess = parcels
        .filter(filterPackagesToGrantAccess(teamMembers))
        .map(({ pkg }) => pkg.packageName);
    if (packagesToGrantAccess.length === 0) {
        Logger_1.default.success('\n🎖  Granting team access not required.');
        return;
    }
    Logger_1.default.info(`\n🎖  ${options.dry ? 'Team access would be granted to' : 'Granting team access to'}`, packagesToGrantAccess.map((name) => green(name)).join(' '));
    if (!options.dry) {
        for (const packageName of packagesToGrantAccess) {
            try {
                await Npm.grantReadWriteAccessAsync(packageName, Npm.EXPO_DEVELOPERS_TEAM_NAME);
            }
            catch (e) {
                Logger_1.default.debug(e.stderr || e.stdout);
                Logger_1.default.error(`🎖  Granting access to ${green(packageName)} failed`);
            }
        }
    }
});
/**
 * Returns filter function that when called returns a boolean whether to grant access or not.
 */
function filterPackagesToGrantAccess(teamMembers) {
    return ({ pkgView, state }) => (pkgView || state.published) && doesSomeoneHaveNoAccessToPackage(teamMembers, pkgView);
}
/**
 * Returns boolean value determining if someone from given users list is not a maintainer of the package.
 */
function doesSomeoneHaveNoAccessToPackage(users, pkgView) {
    if (!pkgView) {
        return true;
    }
    // Maintainers array has items of shape: "username <user@domain.com>" so we strip everything after whitespace.
    const maintainers = pkgView.maintainers.map((maintainer) => maintainer.replace(/^(.+)\s.*$/, '$1'));
    return users.some((user) => !maintainers.includes(user));
}
//# sourceMappingURL=grantTeamAccessToPackages.js.map