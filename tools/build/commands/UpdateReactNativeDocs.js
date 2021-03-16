"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const Git_1 = require("../Git");
const Logger_1 = __importDefault(require("../Logger"));
const expotools_1 = require("../expotools");
const EXPO_DIR = expotools_1.Directories.getExpoRepositoryRootDir();
const DOCS_DIR = path_1.default.join(EXPO_DIR, 'docs');
const SDK_DOCS_DIR = path_1.default.join(DOCS_DIR, 'pages', 'versions');
const RN_REPO_DIR = path_1.default.join(DOCS_DIR, 'react-native-website');
const RN_WEBSITE_DIR = path_1.default.join(RN_REPO_DIR, 'website');
const RN_DOCS_DIR = path_1.default.join(RN_REPO_DIR, 'docs');
const PREFIX_ADDED = 'ADDED_';
const PREFIX_REMOVED = 'REMOVED_';
const SUFFIX_CHANGED = '.diff';
const DOCS_IGNORED = [
    'appregistry',
    'components-and-apis',
    'drawerlayoutandroid',
    'linking',
    'settings',
    'systrace',
];
const rootRepo = new Git_1.GitDirectory(path_1.default.resolve('.'));
const rnRepo = new Git_1.GitDirectory(RN_REPO_DIR);
const rnDocsRepo = new Git_1.GitDirectory(RN_DOCS_DIR);
async function action(input) {
    const options = await getOptions(input);
    if (!(await validateGitStatusAsync())) {
        return;
    }
    await updateDocsAsync(options);
    const summary = getDocsSummary(await getLocalFilesAsync(options), await getUpstreamFilesAsync(options));
    Logger_1.default.log();
    await applyAddedFilesAsync(options, summary);
    await applyChangedFilesAsync(options, summary);
    await applyRemovedFilesAsync(options, summary);
    logCompleted(options);
}
async function getOptions(input) {
    const questions = [];
    const existingSdks = (await fs_extra_1.default.promises.readdir(SDK_DOCS_DIR, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name !== 'latest')
        .map((entry) => entry.name.replace(/v([0-9]+)/, '$1'));
    if (input.sdk && !existingSdks.includes(input.sdk)) {
        throw new Error(`SDK docs ${input.sdk} does not exist, please create it with "et generate-sdk-docs"`);
    }
    if (!input.sdk) {
        questions.push({
            type: 'list',
            name: 'sdk',
            message: 'What Expo SDK version do you want to update?',
            choices: existingSdks,
        });
    }
    if (!input.from) {
        questions.push({
            type: 'input',
            name: 'from',
            message: 'From which commit of the React Native Website do you want to update? (e.g. 9806ddd)',
            filter: (value) => value.trim(),
            validate: (value) => value.length !== 0,
        });
    }
    const answers = questions.length > 0 ? await inquirer_1.default.prompt(questions) : {};
    return {
        sdk: `v${answers.sdk || input.sdk}`,
        from: answers.from || input.from,
        to: input.to || 'master',
    };
}
async function validateGitStatusAsync() {
    Logger_1.default.info('\n📑 Checking local repository status...');
    const result = await rootRepo.runAsync(['status', '--porcelain']);
    const status = result.stdout === '' ? 'clean' : 'dirty';
    if (status === 'clean') {
        return true;
    }
    Logger_1.default.warn(`⚠️  Your git working tree is`, chalk_1.default.underline('dirty'));
    Logger_1.default.info(`It's recommended to ${chalk_1.default.bold('commit all your changes before proceeding')}, so you can revert the changes made by this command if necessary.`);
    const { useDirtyGit } = await inquirer_1.default.prompt({
        type: 'confirm',
        name: 'useDirtyGit',
        message: `Would you like to proceed?`,
        default: false,
    });
    Logger_1.default.log();
    return useDirtyGit;
}
async function updateDocsAsync(options) {
    Logger_1.default.info(`📚 Updating ${chalk_1.default.cyan('react-native-website')} submodule...`);
    await rnRepo.runAsync(['checkout', 'master']);
    await rnRepo.pullAsync({});
    if (!(await rnRepo.tryAsync(['checkout', options.from]))) {
        throw new Error(`The --from commit "${options.from}" doesn't exists in the submodule.`);
    }
    if (!(await rnRepo.tryAsync(['checkout', options.to]))) {
        throw new Error(`The --to commit "${options.to}" doesn't exists in the submodule.`);
    }
}
async function getLocalFilesAsync(options) {
    Logger_1.default.info('🔎 Resolving local docs from', chalk_1.default.underline(options.sdk), 'folder...');
    const versionedDocsPath = path_1.default.join(SDK_DOCS_DIR, options.sdk, 'react-native');
    const files = await fs_extra_1.default.promises.readdir(versionedDocsPath);
    return files
        .filter(entry => !entry.endsWith(SUFFIX_CHANGED) &&
        !entry.startsWith(PREFIX_ADDED) &&
        !entry.startsWith(PREFIX_REMOVED))
        .map(entry => entry.replace('.md', ''));
}
async function getUpstreamFilesAsync(options) {
    Logger_1.default.info('🔎 Resolving upstream docs from', chalk_1.default.underline('react-native-website'), 'submodule...');
    const sidebarPath = path_1.default.join(RN_WEBSITE_DIR, 'sidebars.json');
    const sidebarData = await fs_extra_1.default.readJson(sidebarPath);
    let relevantNestedDocs = [];
    try {
        relevantNestedDocs = [
            ...sidebarData.api.APIs,
            ...sidebarData.components['Core Components'],
            ...sidebarData.components.Props,
        ];
    }
    catch (error) {
        Logger_1.default.error('\n🚫 There was an error extracting the sidebar information.');
        Logger_1.default.info('Please double-check the sidebar and update the "relevantNestedDocs" in this script.');
        Logger_1.default.info(chalk_1.default.dim(`./${path_1.default.relative(process.cwd(), sidebarPath)}\n`));
        throw error;
    }
    const upstreamDocs = [];
    const relevantDocs = relevantNestedDocs.map(entry => {
        if (typeof entry === 'object' && Array.isArray(entry.ids)) {
            return entry.ids;
        }
        if (typeof entry === 'string') {
            return entry;
        }
    });
    for (const entry of relevantDocs.flat()) {
        const docExists = await fs_extra_1.default.pathExists(path_1.default.join(RN_DOCS_DIR, `${entry}.md`));
        const docIsIgnored = DOCS_IGNORED.includes(entry);
        if (docExists && !docIsIgnored) {
            upstreamDocs.push(entry);
        }
    }
    return upstreamDocs;
}
function getDocsSummary(localFiles, upstreamFiles) {
    const removed = localFiles.filter(entry => !upstreamFiles.includes(entry));
    const added = upstreamFiles.filter(entry => !localFiles.includes(entry));
    const changed = upstreamFiles.filter(entry => !(removed.includes(entry) || added.includes(entry)));
    return { removed, added, changed };
}
async function applyRemovedFilesAsync(options, summary) {
    if (!summary.removed.length) {
        return Logger_1.default.info('🤷‍ Upstream did not', chalk_1.default.red('remove'), 'any files');
    }
    for (const entry of summary.removed) {
        if (entry.startsWith(PREFIX_REMOVED)) {
            continue;
        }
        const sdkDocsDir = path_1.default.join(SDK_DOCS_DIR, options.sdk, 'react-native');
        await fs_extra_1.default.move(path_1.default.join(sdkDocsDir, `${entry}.md`), path_1.default.join(sdkDocsDir, `${PREFIX_REMOVED}${entry}.md`));
    }
    Logger_1.default.info('➖ Upstream', chalk_1.default.underline(`removed ${summary.removed.length} files`), `see "${PREFIX_REMOVED}*.md" files.`);
}
async function applyAddedFilesAsync(options, summary) {
    if (!summary.added.length) {
        return Logger_1.default.info('🤷‍ Upstream did not', chalk_1.default.green('add'), 'any files');
    }
    for (const entry of summary.added) {
        if (entry.startsWith(PREFIX_ADDED)) {
            continue;
        }
        await fs_extra_1.default.copyFile(path_1.default.join(RN_DOCS_DIR, `${entry}.md`), path_1.default.join(SDK_DOCS_DIR, options.sdk, 'react-native', `${PREFIX_ADDED}${entry}.md`));
    }
    Logger_1.default.info(`➕ Upstream ${chalk_1.default.underline(`added ${summary.added.length} files`)}, see "${PREFIX_ADDED}*.md" files.`);
}
async function applyChangedFilesAsync(options, summary) {
    if (!summary.changed.length) {
        return Logger_1.default.info('🤷‍ Upstream did not', chalk_1.default.yellow('change'), 'any files');
    }
    for (const entry of summary.changed) {
        const diffPath = path_1.default.join(SDK_DOCS_DIR, options.sdk, 'react-native', `${entry}${SUFFIX_CHANGED}`);
        const { output: diff } = await rnDocsRepo.runAsync([
            'format-patch',
            `${options.from}..HEAD`,
            '--relative',
            `${entry}.md`,
            '--stdout',
        ]);
        await fs_extra_1.default.writeFile(diffPath, diff.join(''));
    }
    Logger_1.default.info('➗ Upstream', chalk_1.default.underline(`changed ${summary.changed.length} files`), `see "*${SUFFIX_CHANGED}" files.`);
}
function logCompleted(options) {
    const versionedDir = path_1.default.join(SDK_DOCS_DIR, options.sdk, 'react-native');
    Logger_1.default.success('\n✅ Update completed.');
    Logger_1.default.info('Please check the files in the versioned react-native folder.');
    Logger_1.default.info('To revert the changes, use `git clean -xdf .` and `git checkout .` in the versioned folder:');
    Logger_1.default.info(chalk_1.default.dim(`./${path_1.default.relative(process.cwd(), versionedDir)}\n`));
}
exports.default = program => {
    program
        .command('update-react-native-docs')
        .option('--sdk <string>', 'SDK version to merge with (e.g. `unversioned` or `37.0.0`)')
        .option('--from <commit>', 'React Native Docs commit to start from')
        .option('--to <commit>', 'React Native Docs commit to end at (defaults to `master`)')
        .description(`Fetches the React Native Docs changes in the commit range and create diffs to manually merge it.`)
        .asyncAction(action);
};
//# sourceMappingURL=UpdateReactNativeDocs.js.map