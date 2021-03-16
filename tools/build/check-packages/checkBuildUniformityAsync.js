"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Utils_1 = require("../Utils");
const Logger_1 = __importDefault(require("../Logger"));
const Constants_1 = require("../Constants");
/**
 * Checks whether the state of build files is the same after running build script.
 * @param pkg Package to check
 */
async function checkBuildUniformityAsync(pkg) {
    const child = await Utils_1.spawnAsync('git', ['status', '--porcelain', './build'], {
        stdio: 'pipe',
        cwd: pkg.path,
    });
    const lines = child.stdout ? child.stdout.trim().split(/\r\n?|\n/g) : [];
    if (lines.length > 0) {
        Logger_1.default.error(`The following build files need to be rebuilt and committed:`);
        lines.map((line) => {
            const filePath = path_1.default.join(Constants_1.EXPO_DIR, line.replace(/^\s*\S+\s*/g, ''));
            Logger_1.default.warn(path_1.default.relative(pkg.path, filePath));
        });
        throw new Error(`The build folder for ${pkg.packageName} has uncommitted changes after building.`);
    }
}
exports.default = checkBuildUniformityAsync;
//# sourceMappingURL=checkBuildUniformityAsync.js.map