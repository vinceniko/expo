"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUnpublished = void 0;
const TasksRunner_1 = require("../../TasksRunner");
const Logger_1 = __importDefault(require("../../Logger"));
const helpers_1 = require("../helpers");
const findUnpublished_1 = require("./findUnpublished");
const resolveReleaseTypeAndVersion_1 = require("./resolveReleaseTypeAndVersion");
/**
 * Lists packages that have any unpublished changes.
 */
exports.listUnpublished = new TasksRunner_1.Task({
    name: 'listUnpublished',
    dependsOn: [findUnpublished_1.findUnpublished, resolveReleaseTypeAndVersion_1.resolveReleaseTypeAndVersion],
}, async (parcels) => {
    Logger_1.default.info('\n🧩 Unpublished packages:');
    parcels.forEach(helpers_1.printPackageParcel);
});
//# sourceMappingURL=listUnpublished.js.map