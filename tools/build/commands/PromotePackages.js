"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TasksRunner_1 = require("../TasksRunner");
const promotePackages_1 = require("../promote-packages/tasks/promotePackages");
const listPackagesToPromote_1 = require("../promote-packages/tasks/listPackagesToPromote");
exports.default = (program) => {
    program
        .command('promote-packages [packageNames...]')
        .alias('promote-pkgs')
        .option('-e, --exclude <packageName>', 'Name of the package to be excluded from promoting. Can be passed multiple times to exclude more than one package. It has higher priority than the list of package names to promote.', (value, previous) => previous.concat(value), [])
        .option('-t, --tag <tag>', 'Tag to which packages should be promoted. Defaults to `latest`.', 'latest')
        .option('--no-select', 'With this flag the script will not prompt to select packages, they all will be selected by default.', false)
        .option('--no-drop', 'Without this flag, existing tags for the local version would be dropped after all.', false)
        .option('-d, --demote', 'Enables tag demoting. If passed, the tag can be overriden even if its current version is higher than locally.', false)
        .option('-l, --list', 'Lists packages with unpublished changes since the previous version.', false)
        /* debug */
        .option('-D, --dry', 'Whether to skip `npm dist-tag add` command.', false)
        .description('Promotes local versions of monorepo packages to given tag on NPM repository.')
        .asyncAction(async (packageNames, options) => {
        // Commander doesn't put arguments to options object, let's add it for convenience. In fact, this is an option.
        options.packageNames = packageNames;
        const taskRunner = new TasksRunner_1.TaskRunner({
            tasks: tasksForOptions(options),
        });
        await taskRunner.runAndExitAsync([], options);
    });
};
/**
 * Returns target task instances based on provided command options.
 */
function tasksForOptions(options) {
    if (options.list) {
        return [listPackagesToPromote_1.listPackagesToPromote];
    }
    return [promotePackages_1.promotePackages];
}
//# sourceMappingURL=PromotePackages.js.map