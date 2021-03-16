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
exports.printPackagesToPromote = exports.formatVersionChange = exports.createParcelAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Changelogs = __importStar(require("../Changelogs"));
const Git_1 = require("../Git");
const Logger_1 = __importDefault(require("../Logger"));
const { cyan, green, magenta, red, gray } = chalk_1.default;
/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 */
async function createParcelAsync(pkg) {
    return {
        pkg,
        pkgView: await pkg.getPackageViewAsync(),
        changelog: Changelogs.loadFrom(pkg.changelogPath),
        gitDir: new Git_1.GitDirectory(pkg.path),
        state: {},
    };
}
exports.createParcelAsync = createParcelAsync;
/**
 * Formats version change from version A to version B.
 */
function formatVersionChange(fromVersion, toVersion) {
    const from = fromVersion ? cyan.bold(fromVersion) : gray.bold('none');
    const to = cyan.bold(toVersion);
    return `from ${from} to ${to}`;
}
exports.formatVersionChange = formatVersionChange;
/**
 * Prints a lists of packages to promote or demote.
 */
function printPackagesToPromote(parcels) {
    const toPromote = parcels.filter(({ state }) => !state.isDemoting);
    const toDemote = parcels.filter(({ state }) => state.isDemoting);
    printPackagesToPromoteInternal(toPromote, `Following packages would be ${green.bold('promoted')}:`);
    printPackagesToPromoteInternal(toDemote, `Following packages could be ${red.bold('demoted')} ${gray(`(requires --demote flag)`)}:`);
}
exports.printPackagesToPromote = printPackagesToPromote;
function printPackagesToPromoteInternal(parcels, headerText) {
    if (parcels.length > 0) {
        Logger_1.default.log('  ', magenta(headerText));
        for (const { pkg, state } of parcels) {
            Logger_1.default.log('    ', green(pkg.packageName), formatVersionChange(state.versionToReplace, pkg.packageVersion));
        }
    }
}
//# sourceMappingURL=helpers.js.map