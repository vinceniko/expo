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
exports.createParcelAsync = exports.prepareParcels = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const Git_1 = __importDefault(require("../../Git"));
const Changelogs = __importStar(require("../../Changelogs"));
const Packages_1 = require("../../Packages");
const TasksRunner_1 = require("../../TasksRunner");
const { green } = chalk_1.default;
/**
 * Gets a list of public packages in the monorepo, downloads `npm view` result of them,
 * creates their Changelog instance and fills in given parcels array (it's empty at the beginning).
 */
exports.prepareParcels = new TasksRunner_1.Task({
    name: 'prepareParcels',
}, async (parcels, options) => {
    Logger_1.default.info('🔎 Gathering data about packages...');
    const { packageNames } = options;
    const allPackages = await Packages_1.getListOfPackagesAsync();
    const allPackagesObj = allPackages.reduce((acc, pkg) => {
        acc[pkg.packageName] = pkg;
        return acc;
    }, {});
    // Verify that provided package names are valid.
    for (const packageName of packageNames) {
        if (!allPackagesObj[packageName]) {
            throw new Error(`Package with provided name ${green(packageName)} does not exist.`);
        }
    }
    const filteredPackages = allPackages.filter((pkg) => {
        const isPrivate = pkg.packageJson.private;
        const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
        return !isPrivate && isIncluded;
    });
    parcels.push(...(await Promise.all(filteredPackages.map(createParcelAsync))));
    if (packageNames.length > 0) {
        // Even if some packages have been explicitly listed as command arguments,
        // we also must take their dependencies into account.
        const parcelsObj = parcels.reduce((acc, parcel) => {
            acc[parcel.pkg.packageName] = parcel;
            return acc;
        }, {});
        await recursivelyResolveDependenciesAsync(allPackagesObj, parcelsObj, parcels);
    }
});
/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 */
async function createParcelAsync(pkg) {
    const pkgView = await pkg.getPackageViewAsync();
    const changelog = Changelogs.loadFrom(pkg.changelogPath);
    const gitDir = new Git_1.default.Directory(pkg.path);
    return {
        pkg,
        pkgView,
        changelog,
        gitDir,
        dependents: [],
        dependencies: [],
        state: {},
    };
}
exports.createParcelAsync = createParcelAsync;
/**
 * Recursively resolves dependencies for every chosen package.
 */
async function recursivelyResolveDependenciesAsync(allPackagesObject, parcelsObject, parcels) {
    const newParcels = [];
    for (const parcel of parcels) {
        const dependencies = parcel.pkg.getDependencies().filter((dependency) => {
            return (dependency.versionRange !== '*' &&
                allPackagesObject[dependency.name] &&
                !parcelsObject[dependency.name]);
        });
        await Promise.all(dependencies.map(async ({ name }) => {
            const dependencyPkg = allPackagesObject[name];
            let dependencyParcel = parcelsObject[name];
            // If a parcel for this dependency doesn't exist yet, let's create it.
            if (!dependencyParcel) {
                dependencyParcel = await createParcelAsync(dependencyPkg);
                parcelsObject[name] = dependencyParcel;
                newParcels.push(dependencyParcel);
            }
            dependencyParcel.dependents.push(parcel);
            parcel.dependencies.push(dependencyParcel);
        }));
    }
    if (newParcels.length > 0) {
        await recursivelyResolveDependenciesAsync(allPackagesObject, parcelsObject, newParcels);
        parcels.push(...newParcels);
    }
}
//# sourceMappingURL=prepareParcels.js.map