"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPackagesPipeline = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const checkEnvironmentTask_1 = require("./checkEnvironmentTask");
const checkPackagesIntegrity_1 = require("./checkPackagesIntegrity");
const checkRepositoryStatus_1 = require("./checkRepositoryStatus");
const cleanPrebuildsTask_1 = require("./cleanPrebuildsTask");
const commentOnIssuesTask_1 = require("./commentOnIssuesTask");
const commitStagedChanges_1 = require("./commitStagedChanges");
const cutOffChangelogs_1 = require("./cutOffChangelogs");
const grantTeamAccessToPackages_1 = require("./grantTeamAccessToPackages");
const prebuildPackagesTask_1 = require("./prebuildPackagesTask");
const prepareParcels_1 = require("./prepareParcels");
const publishPackages_1 = require("./publishPackages");
const pushCommittedChanges_1 = require("./pushCommittedChanges");
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
const updateAndroidProjects_1 = require("./updateAndroidProjects");
const updateBundledNativeModulesFile_1 = require("./updateBundledNativeModulesFile");
const updateIosProjects_1 = require("./updateIosProjects");
const updatePackageVersions_1 = require("./updatePackageVersions");
const updateWorkspaceProjects_1 = require("./updateWorkspaceProjects");
const { cyan, yellow } = chalk_1.default;
/**
 * Pipeline with a bunch of tasks required to publish packages.
 */
exports.publishPackagesPipeline = new TasksRunner_1.Task({
    name: 'publishPackagesPipeline',
    dependsOn: [
        checkEnvironmentTask_1.checkEnvironmentTask,
        checkRepositoryStatus_1.checkRepositoryStatus,
        prepareParcels_1.prepareParcels,
        checkPackagesIntegrity_1.checkPackagesIntegrity,
        selectPackagesToPublish_1.selectPackagesToPublish,
        updatePackageVersions_1.updatePackageVersions,
        updateBundledNativeModulesFile_1.updateBundledNativeModulesFile,
        updateWorkspaceProjects_1.updateWorkspaceProjects,
        updateAndroidProjects_1.updateAndroidProjects,
        updateIosProjects_1.updateIosProjects,
        cutOffChangelogs_1.cutOffChangelogs,
        commitStagedChanges_1.commitStagedChanges,
        pushCommittedChanges_1.pushCommittedChanges,
        prebuildPackagesTask_1.prebuildPackagesTask,
        publishPackages_1.publishPackages,
        cleanPrebuildsTask_1.cleanPrebuildsTask,
        grantTeamAccessToPackages_1.grantTeamAccessToPackages,
        commentOnIssuesTask_1.commentOnIssuesTask,
    ],
}, async (parcels, options) => {
    const count = parcels.length;
    Logger_1.default.success(`\n✅ Successfully published ${cyan.bold(count + '')} package${count > 1 ? 's' : ''}.\n`);
    if (options.tag !== 'latest') {
        Logger_1.default.log(`Run ${cyan.bold('et promote-packages')} to promote them to ${yellow('latest')} tag.`);
    }
});
//# sourceMappingURL=publishPackagesPipeline.js.map