"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareParcels = void 0;
const Logger_1 = __importDefault(require("../../Logger"));
const Packages_1 = require("../../Packages");
const TasksRunner_1 = require("../../TasksRunner");
const helpers_1 = require("../helpers");
/**
 * Gets a list of public packages in the monorepo, downloads `npm view` result of them,
 * creates their Changelog instance and fills in given parcels array (it's empty at the beginning).
 */
exports.prepareParcels = new TasksRunner_1.Task({
    name: 'prepareParcels',
}, async (parcels, options) => {
    Logger_1.default.info('🔎 Gathering data about packages...');
    const { exclude, packageNames } = options;
    const allPackages = await Packages_1.getListOfPackagesAsync();
    const filteredPackages = allPackages.filter((pkg) => {
        const isPrivate = pkg.packageJson.private;
        const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
        const isExcluded = exclude.includes(pkg.packageName);
        return !isPrivate && isIncluded && !isExcluded;
    });
    parcels.push(...(await Promise.all(filteredPackages.map(helpers_1.createParcelAsync))));
});
//# sourceMappingURL=prepareParcels.js.map