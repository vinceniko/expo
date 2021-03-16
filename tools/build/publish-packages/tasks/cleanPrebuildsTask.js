"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanPrebuildsTask = void 0;
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const Prebuilder_1 = require("../../prebuilds/Prebuilder");
/**
 * Cleans up after building prebuilds and publishing them.
 */
exports.cleanPrebuildsTask = new TasksRunner_1.Task({
    name: 'cleanPrebuildsTask',
}, async (parcels) => {
    Logger_1.default.log();
    const packagesToClean = parcels.map(({ pkg }) => pkg).filter(Prebuilder_1.canPrebuildPackage);
    if (packagesToClean.length) {
        Logger_1.default.info('🧹 Cleaning prebuilt resources');
        await Prebuilder_1.cleanFrameworksAsync(packagesToClean);
    }
});
//# sourceMappingURL=cleanPrebuildsTask.js.map