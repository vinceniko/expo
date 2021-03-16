"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectPackagesToPublish = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const semver_1 = __importDefault(require("semver"));
const Logger_1 = __importDefault(require("../../Logger"));
const TasksRunner_1 = require("../../TasksRunner");
const helpers_1 = require("../helpers");
const findUnpublished_1 = require("./findUnpublished");
const resolveReleaseTypeAndVersion_1 = require("./resolveReleaseTypeAndVersion");
const { green, cyan, red } = chalk_1.default;
const CUSTOM_VERSION_CHOICE_VALUE = 'custom-version';
/**
 * Prompts which suggested packages are going to be published.
 */
exports.selectPackagesToPublish = new TasksRunner_1.Task({
    name: 'selectPackagesToPublish',
    dependsOn: [findUnpublished_1.findUnpublished, resolveReleaseTypeAndVersion_1.resolveReleaseTypeAndVersion],
}, async (parcels, options) => {
    Logger_1.default.info('\n👉 Selecting packages to publish...');
    const newParcels = [];
    for (const parcel of parcels) {
        helpers_1.printPackageParcel(parcel);
        if (await selectPackageToPublishAsync(parcel)) {
            newParcels.push(parcel);
        }
    }
    if (newParcels.length === 0) {
        Logger_1.default.success('🤷‍♂️ There is nothing to be published.');
        return TasksRunner_1.Task.STOP;
    }
    return [newParcels, options];
});
/**
 * Prompts the user to confirm whether the package should be published.
 * It immediately returns `true` if it's run on the CI.
 */
async function selectPackageToPublishAsync(parcel) {
    if (process.env.CI) {
        return true;
    }
    const packageName = parcel.pkg.packageName;
    const version = parcel.state.releaseVersion;
    const { selected } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'selected',
            prefix: '❔',
            message: `Do you want to publish ${green.bold(packageName)} as ${cyan.bold(version)}?`,
            default: true,
        },
    ]);
    if (!selected) {
        const incrementedVersions = incrementVersion(parcel.pkg.packageVersion);
        const { version, customVersion } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'version',
                prefix: '❔',
                message: `What do you want to do with ${green.bold(packageName)}?`,
                choices: [
                    {
                        name: "Don't publish",
                        value: null,
                    },
                    ...Object.keys(incrementedVersions).map((type) => {
                        return {
                            name: `Publish as ${cyan.bold(incrementedVersions[type])} (${type})`,
                            value: incrementedVersions[type],
                        };
                    }),
                    {
                        name: 'Publish as custom version',
                        value: CUSTOM_VERSION_CHOICE_VALUE,
                    },
                ],
                validate: validateVersion(parcel),
            },
            {
                type: 'input',
                name: 'customVersion',
                prefix: '❔',
                message: 'Type in custom version to publish:',
                when(answers) {
                    return answers.version === CUSTOM_VERSION_CHOICE_VALUE;
                },
                validate: validateVersion(parcel),
            },
        ]);
        if (customVersion || version) {
            parcel.state.releaseVersion = customVersion || version;
            return true;
        }
    }
    return selected;
}
/**
 * Creates an object with possible incrementations of given version.
 */
function incrementVersion(version) {
    const releaseTypes = ['major', 'minor', 'patch'];
    return releaseTypes.reduce((acc, type) => {
        acc[type] = semver_1.default.inc(version, type);
        return acc;
    }, {});
}
/**
 * Returns a function that validates the version for given parcel.
 */
function validateVersion(parcel) {
    return (input) => {
        if (input) {
            if (!semver_1.default.valid(input)) {
                return red(`${cyan.bold(input)} is not a valid semver version.`);
            }
            if (parcel.pkgView && parcel.pkgView.versions.includes(input)) {
                return red(`${cyan.bold(input)} has already been published.`);
            }
        }
        return true;
    };
}
//# sourceMappingURL=selectPackagesToPublish.js.map