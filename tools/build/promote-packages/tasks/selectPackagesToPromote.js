"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectPackagesToPromote = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const readline_1 = __importDefault(require("readline"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const helpers_1 = require("../helpers");
const findPackagesToPromote_1 = require("./findPackagesToPromote");
const { green, red } = chalk_1.default;
/**
 * Prompts the user to select packages to promote or demote.
 * It's skipped if `--no-select` option is used or it's run on the CI.
 */
exports.selectPackagesToPromote = new TasksRunner_1.Task({
    name: 'selectPackagesToPromote',
    dependsOn: [findPackagesToPromote_1.findPackagesToPromote],
}, async (parcels, options) => {
    if (!options.select || process.env.CI) {
        return [parcels, options];
    }
    Logger_1.default.info('\n👉 Selecting packages to promote...\n');
    const packageNames = await promptForPackagesToPromoteAsync(parcels);
    const newParcels = parcels.filter(({ pkg }) => packageNames.includes(pkg.packageName));
    return [newParcels, options];
});
/**
 * Prompts the user to select packages to promote or demote.
 */
async function promptForPackagesToPromoteAsync(parcels) {
    var _a;
    const maxLength = parcels.reduce((acc, { pkg }) => Math.max(acc, pkg.packageName.length), 0);
    const choices = parcels.map(({ pkg, state }) => {
        const action = state.isDemoting ? red.bold('demote') : green.bold('promote');
        return {
            name: `${green(pkg.packageName.padEnd(maxLength))} ${action} ${helpers_1.formatVersionChange(state.versionToReplace, pkg.packageVersion)}`,
            value: pkg.packageName,
            checked: !state.isDemoting,
        };
    });
    const { selectedPackageNames } = await inquirer_1.default.prompt([
        {
            type: 'checkbox',
            name: 'selectedPackageNames',
            message: 'Which packages do you want to promote?\n',
            choices: [
                // Choices unchecked by default (these being demoted) should be on top.
                // We could sort them, but JS sorting algorithm is unstable :/
                ...choices.filter((choice) => !choice.checked),
                ...choices.filter((choice) => choice.checked),
            ],
            pageSize: Math.max(15, ((_a = process.stdout.rows) !== null && _a !== void 0 ? _a : 15) - 15),
        },
    ]);
    // Inquirer shows all those selected choices by name and that looks so ugly due to line wrapping.
    // If possible, we clear everything that has been printed after the prompt.
    if (process.stdout.columns) {
        const bufferLength = choices.reduce((acc, choice) => acc + strip_ansi_1.default(choice.name).length + 2, 0);
        readline_1.default.moveCursor(process.stdout, 0, -Math.ceil(bufferLength / process.stdout.columns));
        readline_1.default.clearScreenDown(process.stdout);
    }
    return selectedPackageNames;
}
//# sourceMappingURL=selectPackagesToPromote.js.map