"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const ProjectTemplates_1 = require("../ProjectTemplates");
const expotools_1 = require("../expotools");
const EXPO_DIR = expotools_1.Directories.getExpoRepositoryRootDir();
async function shouldAssignLatestTagAsync(templateName, templateVersion) {
    const { assignLatestTag } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'assignLatestTag',
            message: `Do you want to assign ${chalk_1.default.blue('latest')} tag to ${chalk_1.default.green(templateName)}@${chalk_1.default.red(templateVersion)}?`,
            default: true,
        },
    ]);
    return assignLatestTag;
}
async function action(options) {
    if (!options.sdkVersion) {
        const { version: expoSdkVersion } = await json_file_1.default.readAsync(path_1.default.join(EXPO_DIR, 'packages/expo/package.json'));
        const { sdkVersion } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'sdkVersion',
                message: "What is the Expo SDK version the project templates you're going to publish are compatible with?",
                default: `${semver_1.default.major(expoSdkVersion)}.0.0`,
                validate(value) {
                    if (!semver_1.default.valid(value)) {
                        return `${value} is not a valid version.`;
                    }
                    return true;
                },
            },
        ]);
        options.sdkVersion = sdkVersion;
    }
    const availableProjectTemplates = await ProjectTemplates_1.getAvailableProjectTemplatesAsync();
    const projectTemplatesToPublish = options.project
        ? availableProjectTemplates.filter(({ name }) => name.includes(options.project))
        : availableProjectTemplates;
    if (projectTemplatesToPublish.length === 0) {
        console.log(chalk_1.default.yellow('No project templates to publish. Make sure --project flag is correct.'));
        return;
    }
    console.log('\nFollowing project templates will be published:');
    console.log(projectTemplatesToPublish.map(({ name }) => chalk_1.default.green(name)).join(chalk_1.default.grey(', ')), '\n');
    for (const template of projectTemplatesToPublish) {
        const { newVersion } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'newVersion',
                message: `What is the new version for ${chalk_1.default.green(template.name)} package?`,
                default: semver_1.default.lt(template.version, options.sdkVersion)
                    ? options.sdkVersion
                    : semver_1.default.inc(template.version, 'patch'),
                validate(value) {
                    if (!semver_1.default.valid(value)) {
                        return `${value} is not a valid version.`;
                    }
                    if (semver_1.default.lt(value, template.version)) {
                        return `${value} shouldn't be lower than the current version (${template.version})`;
                    }
                    return true;
                },
            },
        ]);
        // Obtain the tag for the template.
        const { tag } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'tag',
                message: `How to tag ${chalk_1.default.green(template.name)}@${chalk_1.default.red(newVersion)}?`,
                default: semver_1.default.prerelease(newVersion) ? 'next' : `sdk-${semver_1.default.major(options.sdkVersion)}`,
            },
        ]);
        // Update package version in `package.json`
        await json_file_1.default.setAsync(path_1.default.join(template.path, 'package.json'), 'version', newVersion);
        const appJsonPath = path_1.default.join(template.path, 'app.json');
        if ((await fs_extra_1.default.pathExists(appJsonPath)) &&
            (await json_file_1.default.getAsync(appJsonPath, 'expo.sdkVersion', null))) {
            // Make sure SDK version in `app.json` is correct
            console.log(`Setting ${chalk_1.default.magenta('expo.sdkVersion')} to ${chalk_1.default.green(options.sdkVersion)} in template's app.json...`);
            await json_file_1.default.setAsync(path_1.default.join(template.path, 'app.json'), 'expo.sdkVersion', options.sdkVersion);
        }
        console.log(`Publishing ${chalk_1.default.green(template.name)}@${chalk_1.default.red(newVersion)}...`);
        const moreArgs = [];
        if (tag) {
            // Assign custom tag in the publish command, so we don't accidentally publish as latest.
            moreArgs.push('--tag', tag);
        }
        // Publish to NPM registry
        options.dry ||
            (await spawn_async_1.default('npm', ['publish', '--access', 'public', ...moreArgs], {
                stdio: 'inherit',
                cwd: template.path,
            }));
        if (tag && (await shouldAssignLatestTagAsync(template.name, newVersion))) {
            console.log(`Assigning ${chalk_1.default.blue('latest')} tag to ${chalk_1.default.green(template.name)}@${chalk_1.default.red(newVersion)}...`);
            // Add the latest tag to the new version
            options.dry ||
                (await spawn_async_1.default('npm', ['dist-tag', 'add', `${template.name}@${newVersion}`, 'latest'], {
                    stdio: 'inherit',
                    cwd: template.path,
                }));
        }
        console.log();
    }
}
exports.default = (program) => {
    program
        .command('publish-project-templates')
        .alias('publish-templates', 'ppt')
        .option('-s, --sdkVersion [string]', 'Expo SDK version that the templates are compatible with. (optional)')
        .option('-p, --project [string]', 'Name of the template project to publish. (optional)')
        .option('-d, --dry', 'Run the script in the dry mode, that is without publishing.')
        .description('Publishes project templates under `templates` directory.')
        .asyncAction(action);
};
//# sourceMappingURL=PublishProjectTemplates.js.map