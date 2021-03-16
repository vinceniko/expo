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
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
const Git_1 = require("../Git");
const Logger_1 = __importDefault(require("../Logger"));
const ProjectVersions_1 = require("../ProjectVersions");
const Workspace = __importStar(require("../Workspace"));
const vendoring_1 = require("../vendoring");
const config_1 = __importDefault(require("../vendoring/config"));
const legacy_1 = require("../vendoring/legacy");
const EXPO_GO_TARGET = 'expo-go';
exports.default = (program) => {
    program
        .command('update-vendored-module')
        .alias('update-module', 'uvm')
        .description('Updates 3rd party modules.')
        .option('-l, --list', 'Shows a list of available 3rd party modules.', false)
        .option('-o, --list-outdated', 'Shows a list of outdated 3rd party modules.', false)
        .option('-t, --target <string>', 'The target to update, e.g. Expo Go or development client.', EXPO_GO_TARGET)
        .option('-m, --module <string>', 'Name of the module to update.')
        .option('-p, --platform <string>', 'A platform on which the vendored module will be updated.', 'all')
        .option('-c, --commit <string>', 'Git reference on which to checkout when copying 3rd party module.', 'master')
        .option('-s, --semver-prefix <string>', 'Setting this flag forces to use given semver prefix. Some modules may specify them by the config, but in case we want to update to alpha/beta versions we should use an empty prefix to be more strict.', null)
        .option('-u, --update-dependencies', 'Whether to update workspace dependencies and bundled native modules.', true)
        .asyncAction(action);
};
async function action(options) {
    var _a;
    const target = await resolveTargetNameAsync(options.target);
    const targetConfig = config_1.default[target];
    if (options.list || options.listOutdated) {
        if (target !== EXPO_GO_TARGET) {
            throw new Error(`Listing vendored modules for target "${target}" is not supported.`);
        }
        await vendoring_1.listAvailableVendoredModulesAsync(targetConfig.modules, options.listOutdated);
        return;
    }
    const moduleName = await resolveModuleNameAsync(options.module, targetConfig);
    const sourceDirectory = path_1.default.join(os_1.default.tmpdir(), 'ExpoVendoredModules', moduleName);
    const moduleConfig = targetConfig.modules[moduleName];
    Logger_1.default.log('📥 Cloning %s#%s from %s', chalk_1.default.green(moduleName), chalk_1.default.cyan(options.commit), chalk_1.default.magenta(moduleConfig.source));
    try {
        // Clone repository from the source
        await Git_1.GitDirectory.shallowCloneAsync(sourceDirectory, moduleConfig.source, (_a = options.commit) !== null && _a !== void 0 ? _a : 'master');
        const platforms = resolvePlatforms(options.platform);
        for (const platform of platforms) {
            if (!targetConfig.platforms[platform]) {
                continue;
            }
            // TODO(@tsapeta): Remove this once all vendored modules are migrated to the new system.
            if (!targetConfig.modules[moduleName][platform]) {
                // If the target doesn't support this platform, maybe legacy vendoring does.
                Logger_1.default.info('‼️  Using legacy vendoring for platform %s', chalk_1.default.yellow(platform));
                await legacy_1.legacyVendorModuleAsync(moduleName, platform, sourceDirectory);
                continue;
            }
            const relativeTargetDirectory = path_1.default.join(targetConfig.platforms[platform].targetDirectory, moduleName);
            const targetDirectory = path_1.default.join(Constants_1.EXPO_DIR, relativeTargetDirectory);
            Logger_1.default.log('🎯 Vendoring for %s to %s', chalk_1.default.yellow(platform), chalk_1.default.magenta(relativeTargetDirectory));
            // Clean up previous version
            await fs_extra_1.default.remove(targetDirectory);
            // Delegate further steps to platform's provider
            await vendoring_1.vendorPlatformAsync(platform, sourceDirectory, targetDirectory, moduleConfig[platform]);
        }
        // Update dependency versions only for Expo Go target.
        if (options.updateDependencies !== false && target === EXPO_GO_TARGET) {
            const packageJson = require(path_1.default.join(sourceDirectory, 'package.json'));
            const semverPrefix = (options.semverPrefix != null ? options.semverPrefix : moduleConfig.semverPrefix) || '';
            const newVersionRange = `${semverPrefix}${packageJson.version}`;
            await updateDependenciesAsync(moduleName, newVersionRange);
        }
    }
    finally {
        // Clean cloned repo
        await fs_extra_1.default.remove(sourceDirectory);
    }
    Logger_1.default.success('💪 Successfully updated %s\n', chalk_1.default.bold(moduleName));
}
/**
 * Updates versions in bundled native modules and workspace projects.
 */
async function updateDependenciesAsync(moduleName, versionRange) {
    Logger_1.default.log('✍️  Updating bundled native modules');
    await ProjectVersions_1.updateBundledVersionsAsync({
        [moduleName]: versionRange,
    });
    Logger_1.default.log('✍️  Updating workspace dependencies');
    await Workspace.updateDependencyAsync(moduleName, versionRange);
}
/**
 * Validates provided target name or prompts for the valid one.
 */
async function resolveTargetNameAsync(providedTargetName) {
    const targets = Object.keys(config_1.default);
    if (providedTargetName) {
        if (targets.includes(providedTargetName)) {
            return providedTargetName;
        }
        throw new Error(`Couldn't find config for ${providedTargetName} target.`);
    }
    const { targetName } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'targetName',
            prefix: '❔',
            message: 'In which target do you want to update vendored module?',
            choices: targets.map((target) => ({
                name: config_1.default[target].name,
                value: target,
            })),
        },
    ]);
    return targetName;
}
/**
 * Validates provided module name or prompts for the valid one.
 */
async function resolveModuleNameAsync(providedModuleName, targetConfig) {
    const moduleNames = Object.keys(targetConfig.modules);
    if (providedModuleName) {
        if (moduleNames.includes(providedModuleName)) {
            return providedModuleName;
        }
        throw new Error(`Couldn't find config for ${providedModuleName} module.`);
    }
    const { moduleName } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'moduleName',
            prefix: '❔',
            message: 'Which vendored module do you want to update?',
            choices: moduleNames,
        },
    ]);
    return moduleName;
}
function resolvePlatforms(platform) {
    const all = vendoring_1.getVendoringAvailablePlatforms();
    return all.includes(platform) ? [platform] : all;
}
//# sourceMappingURL=UpdateVendoredModule.js.map