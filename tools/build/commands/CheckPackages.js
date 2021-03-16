"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../Logger"));
const getPackagesToCheckAsync_1 = __importDefault(require("../check-packages/getPackagesToCheckAsync"));
const checkPackageAsync_1 = __importDefault(require("../check-packages/checkPackageAsync"));
const { green, magenta, yellow } = chalk_1.default;
exports.default = (program) => {
    program
        .command('check-packages [packageNames...]')
        .alias('check', 'cp')
        .option('-s, --since <commit>', 'Reference to the commit since which you want to run incremental checks. Defaults to HEAD of the master branch.', 'master')
        .option('-a, --all', 'Whether to check all packages and ignore `--since` option.', false)
        .option('--no-build', 'Whether to skip `yarn build` check.', false)
        .option('--no-test', 'Whether to skip `yarn test` check.', false)
        .option('--no-lint', 'Whether to skip `yarn lint` check.', false)
        .option('--fix-lint', 'Whether to run `yarn lint --fix` instead of `yarn lint`.', false)
        .option('--no-uniformity-check', 'Whether to check the uniformity of committed and generated build files.', false)
        .description('Checks if packages build successfully and their tests pass.')
        .asyncAction(main);
};
async function main(packageNames, options) {
    options.packageNames = packageNames;
    const packages = await getPackagesToCheckAsync_1.default(options);
    const failedPackages = [];
    let passCount = 0;
    for (const pkg of packages) {
        if (await checkPackageAsync_1.default(pkg, options)) {
            passCount++;
        }
        else {
            failedPackages.push(pkg.packageName);
        }
        Logger_1.default.log();
    }
    const failureCount = failedPackages.length;
    if (failureCount !== 0) {
        Logger_1.default.log(`${green(`🏁 ${passCount} packages passed`)},`, `${magenta(`${failureCount} ${failureCount === 1 ? 'package' : 'packages'} failed:`)}`, failedPackages.map((failedPackage) => yellow(failedPackage)).join(', '));
        process.exit(1);
        return;
    }
    Logger_1.default.success('🏁 All packages passed.');
}
//# sourceMappingURL=CheckPackages.js.map