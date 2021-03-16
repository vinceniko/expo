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
exports.updateIosProjects = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const CocoaPods_1 = require("../../CocoaPods");
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Utils_1 = require("../../Utils");
const Workspace = __importStar(require("../../Workspace"));
const selectPackagesToPublish_1 = require("./selectPackagesToPublish");
const { green } = chalk_1.default;
/**
 * Updates pods in Expo client's and bare-expo.
 */
exports.updateIosProjects = new TasksRunner_1.Task({
    name: 'updateIosProjects',
    dependsOn: [selectPackagesToPublish_1.selectPackagesToPublish],
    filesToStage: ['ios', 'apps/*/ios/**'],
}, async (parcels) => {
    Logger_1.default.info('\n🍎 Updating iOS projects...');
    const nativeApps = Workspace.getNativeApps();
    await Promise.all(nativeApps.map(async (nativeApp) => {
        const localPods = await Utils_1.filterAsync(parcels, (parcel) => {
            const { podspecName } = parcel.pkg;
            return !!podspecName && nativeApp.hasLocalPodDependencyAsync(podspecName);
        });
        const podspecNames = localPods
            .map((parcel) => parcel.pkg.podspecName)
            .filter(Boolean);
        if (podspecNames.length === 0) {
            Logger_1.default.log('  ', `${green(nativeApp.packageName)}: No pods to update.`);
            return;
        }
        Logger_1.default.log('  ', `${green(nativeApp.packageName)}: Reinstalling pods...`);
        // `pod install` sometimes fails, but it's not needed to properly
        // publish packages, so let's just continue if that happens.
        try {
            await CocoaPods_1.podInstallAsync(path_1.default.join(nativeApp.path, 'ios'), { noRepoUpdate: true });
        }
        catch (e) {
            Logger_1.default.debug(e.stderr || e.stdout);
            Logger_1.default.error('🍎 Failed to install pods in', green(nativeApp.packageName));
            Logger_1.default.error('🍎 Please review the output above and fix it once the publish completes');
        }
    }));
});
//# sourceMappingURL=updateIosProjects.js.map