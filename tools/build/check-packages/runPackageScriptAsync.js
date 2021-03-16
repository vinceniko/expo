"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Utils_1 = require("../Utils");
const Logger_1 = __importDefault(require("../Logger"));
const { cyan, gray, red, reset } = chalk_1.default;
/**
 * Executes the specified script (defined in package.json under "scripts") on the given package.
 */
async function runPackageScriptAsync(pkg, scriptName, args = []) {
    if (!pkg.scripts[scriptName]) {
        // Package doesn't have such script.
        Logger_1.default.debug(`🤷‍♂️ ${cyan(scriptName)} script not found`);
        return;
    }
    const spawnArgs = [scriptName, ...args];
    Logger_1.default.log(`🏃‍♀️ Running ${cyan.italic(`yarn ${spawnArgs.join(' ')}`)}`);
    try {
        await Utils_1.spawnAsync('yarn', spawnArgs, {
            stdio: 'pipe',
            cwd: pkg.path,
        });
    }
    catch (error) {
        Logger_1.default.error(`${cyan(scriptName)} script failed, see process output:`);
        consoleErrorOutput(error.stdout, 'stdout >', reset);
        consoleErrorOutput(error.stderr, 'stderr >', red);
        // Rethrow error so we can count how many checks failed
        throw error;
    }
}
exports.default = runPackageScriptAsync;
function consoleErrorOutput(output, label, color) {
    const lines = output.trim().split(/\r\n?|\n/g);
    Logger_1.default.log(lines.map((line) => `${gray(label)} ${color(line)}`).join('\n'));
}
//# sourceMappingURL=runPackageScriptAsync.js.map