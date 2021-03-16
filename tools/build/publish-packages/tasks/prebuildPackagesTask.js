"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prebuildPackagesTask = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Prebuilder_1 = require("../../prebuilds/Prebuilder");
/**
 * Prebuilds iOS packages that are being distributed with prebuilt binaries.
 */
exports.prebuildPackagesTask = new TasksRunner_1.Task({
    name: 'prebuildPackagesTask',
    required: true,
    backupable: false,
}, async (parcels) => {
    for (const { pkg } of parcels) {
        if (!Prebuilder_1.canPrebuildPackage(pkg)) {
            continue;
        }
        Logger_1.default.info('\n👷‍♀️ Prebuilding %s', chalk_1.default.green(pkg.packageName));
        await Prebuilder_1.prebuildPackageAsync(pkg);
    }
});
//# sourceMappingURL=prebuildPackagesTask.js.map