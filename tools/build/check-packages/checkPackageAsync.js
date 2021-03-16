"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../Logger"));
const runPackageScriptAsync_1 = __importDefault(require("./runPackageScriptAsync"));
const checkBuildUniformityAsync_1 = __importDefault(require("./checkBuildUniformityAsync"));
const { green } = chalk_1.default;
/**
 * Runs package checks on given package.
 */
async function checkPackageAsync(pkg, options) {
    try {
        if (options.isPlugin) {
            Logger_1.default.info(`🔌 Checking ${green.bold(pkg.packageName)} plugin`);
        }
        else {
            Logger_1.default.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);
        }
        const args = options.isPlugin ? ['plugin'] : [];
        if (options.build) {
            await runPackageScriptAsync_1.default(pkg, 'clean', args);
            await runPackageScriptAsync_1.default(pkg, 'build', args);
            if (options.uniformityCheck) {
                await checkBuildUniformityAsync_1.default(pkg);
            }
        }
        if (options.test) {
            const args = ['--watch', 'false', '--passWithNoTests'];
            if (options.isPlugin) {
                args.unshift('plugin');
            }
            if (process.env.CI) {
                // Limit to one worker on CIs
                args.push('--maxWorkers', '1');
            }
            await runPackageScriptAsync_1.default(pkg, 'test', args);
        }
        if (options.lint) {
            const args = ['--max-warnings', '0'];
            if (options.isPlugin) {
                args.unshift('plugin');
            }
            if (options.fixLint) {
                args.push('--fix');
            }
            await runPackageScriptAsync_1.default(pkg, 'lint', args);
        }
        Logger_1.default.log(`✨ ${green.bold(pkg.packageName)} checks passed`);
        if (!options.isPlugin && pkg.hasPlugin) {
            return await checkPackageAsync(pkg, { ...options, isPlugin: true });
        }
        return true;
    }
    catch (_a) {
        // runPackageScriptAsync is intentionally written to handle errors and make it safe to suppress errors in the caller
        return false;
    }
}
exports.default = checkPackageAsync;
//# sourceMappingURL=checkPackageAsync.js.map