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
const chalk_1 = __importDefault(require("chalk"));
const semver_1 = __importDefault(require("semver"));
const set_1 = __importDefault(require("lodash/set"));
const inquirer_1 = __importDefault(require("inquirer"));
const unset_1 = __importDefault(require("lodash/unset"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const xdl_1 = require("@expo/xdl");
const jsondiffpatch = __importStar(require("jsondiffpatch"));
const Constants_1 = require("../Constants");
const Utils_1 = require("../Utils");
async function chooseSdkVersionAsync(sdkVersions) {
    const { sdkVersion } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'sdkVersion',
            default: sdkVersions[0],
            choices: sdkVersions,
        },
    ]);
    return sdkVersion;
}
async function askForCorrectnessAsync() {
    const { isCorrect } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'isCorrect',
            message: `Does this look correct? Type \`y\` or press enter to update ${chalk_1.default.green('staging')} config.`,
            default: true,
        },
    ]);
    return isCorrect;
}
function setConfigValueForKey(config, key, value) {
    if (value === undefined) {
        console.log(`Deleting ${chalk_1.default.yellow(key)} config key ...`);
        unset_1.default(config, key);
    }
    else {
        console.log(`Changing ${chalk_1.default.yellow(key)} config key ...`);
        set_1.default(config, key, value);
    }
}
async function applyChangesToStagingAsync(delta, previousVersions, newVersions) {
    if (!delta) {
        console.log(chalk_1.default.yellow('There are no changes to apply in the configuration.'));
        return;
    }
    console.log(`\nHere is the diff of changes to apply on ${chalk_1.default.green('staging')} version config:`);
    console.log(jsondiffpatch.formatters.console.format(delta, previousVersions));
    const isCorrect = await askForCorrectnessAsync();
    if (isCorrect) {
        // Save new configuration.
        try {
            await xdl_1.Versions.setVersionsAsync(newVersions);
        }
        catch (error) {
            console.error(error);
        }
        console.log(chalk_1.default.green('\nSuccessfully updated staging config. You can check it out on'), chalk_1.default.blue(`https://${Constants_1.STAGING_API_HOST}/--/api/v2/versions`));
    }
    else {
        console.log(chalk_1.default.yellow('Canceled'));
    }
}
async function resetStagingConfigurationAsync() {
    // Get current production config.
    xdl_1.Config.api.host = Constants_1.PRODUCTION_API_HOST;
    const productionVersions = await xdl_1.Versions.versionsAsync();
    // Wait for the cache to invalidate.
    await Utils_1.sleepAsync(10);
    // Get current staging config.
    xdl_1.Config.api.host = Constants_1.STAGING_API_HOST;
    const stagingVersions = await xdl_1.Versions.versionsAsync();
    // Calculate the diff between them.
    const delta = jsondiffpatch.diff(stagingVersions, productionVersions);
    // Reset changes (if any) on staging.
    await applyChangesToStagingAsync(delta, stagingVersions, productionVersions);
}
async function applyChangesToRootAsync(options, versions) {
    const newVersions = cloneDeep_1.default(versions);
    if (options.key) {
        if (!('value' in options) && !options.delete) {
            console.log(chalk_1.default.red('`--key` flag requires `--value` or `--delete` flag.'));
            return;
        }
        setConfigValueForKey(newVersions, options.key, options.delete ? undefined : options.value);
    }
    const delta = jsondiffpatch.diff(versions, newVersions);
    await applyChangesToStagingAsync(delta, versions, newVersions);
}
async function applyChangesToSDKVersionAsync(options, versions) {
    const sdkVersions = Object.keys(versions.sdkVersions).sort(semver_1.default.rcompare);
    const sdkVersion = options.sdkVersion || (await chooseSdkVersionAsync(sdkVersions));
    const containsSdk = sdkVersions.includes(sdkVersion);
    if (!semver_1.default.valid(sdkVersion)) {
        console.error(chalk_1.default.red(`Provided SDK version ${chalk_1.default.cyan(sdkVersion)} is invalid.`));
        return;
    }
    if (!containsSdk) {
        const { addNewSdk } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'addNewSdk',
                message: `Configuration for SDK ${chalk_1.default.cyan(sdkVersion)} doesn't exist. Do you want to initialize it?`,
                default: true,
            },
        ]);
        if (!addNewSdk) {
            console.log(chalk_1.default.yellow('Canceled'));
            return;
        }
    }
    // If SDK is already there, make a deep clone of the sdkVersion config so we can calculate a diff later.
    const sdkVersionConfig = containsSdk ? cloneDeep_1.default(versions.sdkVersions[sdkVersion]) : {};
    console.log(`\nUsing ${chalk_1.default.blue(Constants_1.STAGING_API_HOST)} host ...`);
    console.log(`Using SDK ${chalk_1.default.cyan(sdkVersion)} ...`);
    if ('deprecated' in options) {
        setConfigValueForKey(sdkVersionConfig, 'isDeprecated', !!options.deprecated);
    }
    if ('releaseNoteUrl' in options && typeof options.releaseNoteUrl === 'string') {
        setConfigValueForKey(sdkVersionConfig, 'releaseNoteUrl', options.releaseNoteUrl);
    }
    if (options.key) {
        if (!('value' in options) && !options.delete) {
            console.log(chalk_1.default.red('`--key` flag requires `--value` or `--delete` flag.'));
            return;
        }
        setConfigValueForKey(sdkVersionConfig, options.key, options.delete ? undefined : options.value);
    }
    const newVersions = {
        ...versions,
        sdkVersions: {
            ...versions.sdkVersions,
            [sdkVersion]: sdkVersionConfig,
        },
    };
    if (options.deleteSdk) {
        delete newVersions.sdkVersions[sdkVersion];
    }
    const delta = jsondiffpatch.diff(versions.sdkVersions[sdkVersion], newVersions.sdkVersions[sdkVersion]);
    await applyChangesToStagingAsync(delta, versions.sdkVersions[sdkVersion], newVersions);
}
async function action(options) {
    if (options.reset) {
        await resetStagingConfigurationAsync();
        return;
    }
    xdl_1.Config.api.host = Constants_1.STAGING_API_HOST;
    const versions = await xdl_1.Versions.versionsAsync();
    if (options.root) {
        await applyChangesToRootAsync(options, versions);
    }
    else {
        await applyChangesToSDKVersionAsync(options, versions);
    }
}
exports.default = (program) => {
    program
        .command('update-versions-endpoint')
        .alias('update-versions')
        .description(`Updates SDK configuration under ${chalk_1.default.blue('https://staging.exp.host/--/api/v2/versions')}`)
        .option('-s, --sdkVersion [string]', 'SDK version to update. Can be chosen from the list if not provided.')
        .option('--root', 'Modify a key at the root of the versions config rather than a specific SDK version.', false)
        .option('-d, --deprecated [boolean]', 'Sets chosen SDK version as deprecated.')
        .option('-r, --release-note-url [string]', 'URL pointing to the release blog post.')
        .option('-k, --key [string]', 'A custom, dotted key that you want to set in the configuration.')
        .option('-v, --value [any]', 'Value for the custom key to be set in the configuration.')
        .option('--delete', 'Deletes config entry under key specified by `--key` flag.', false)
        .option('--delete-sdk', 'Deletes configuration for SDK specified by `--sdkVersion` flag.', false)
        .option('--reset', 'Resets changes on staging to the state from production.', false)
        .asyncAction(action);
};
//# sourceMappingURL=UpdateVersionsEndpoint.js.map