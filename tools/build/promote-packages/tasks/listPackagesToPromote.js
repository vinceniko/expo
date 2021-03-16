"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPackagesToPromote = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const helpers_1 = require("../helpers");
const findPackagesToPromote_1 = require("./findPackagesToPromote");
const prepareParcels_1 = require("./prepareParcels");
const { yellow } = chalk_1.default;
/**
 * Lists packages that can be promoted to given tag.
 */
exports.listPackagesToPromote = new TasksRunner_1.Task({
    name: 'listPackagesToPromote',
    dependsOn: [prepareParcels_1.prepareParcels, findPackagesToPromote_1.findPackagesToPromote],
}, async (parcels, options) => {
    if (parcels.length === 0) {
        Logger_1.default.success(`\n✅ No packages to promote.\n`);
        return TasksRunner_1.Task.STOP;
    }
    Logger_1.default.info(`\n📚 Packages to promote to ${yellow.bold(options.tag)}:`);
    helpers_1.printPackagesToPromote(parcels);
});
//# sourceMappingURL=listPackagesToPromote.js.map