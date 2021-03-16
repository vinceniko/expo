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
const path_1 = __importDefault(require("path"));
const Changelogs = __importStar(require("../Changelogs"));
const Directories = __importStar(require("../Directories"));
const Logger_1 = __importDefault(require("../Logger"));
const Formatter_1 = require("../Formatter");
async function checkOrAskForOptions(options) {
    const lengthValidator = (x) => x.length !== 0;
    const stringValidator = {
        filter: (s) => s.trim(),
        validate: lengthValidator,
    };
    const questions = [];
    if (!options.package) {
        questions.push({
            type: 'input',
            name: 'package',
            message: 'What is the package that you want to add?',
            ...stringValidator,
        });
    }
    if (options.pullRequest === true) {
        questions.push({
            type: 'input',
            name: 'pullRequest',
            message: 'What is the pull request number?',
            filter: (pullRequests) => pullRequests
                .split(',')
                .map((pullrequest) => parseInt(pullrequest, 10))
                .filter(Boolean),
            validate: lengthValidator,
        });
    }
    if (!options.author.length) {
        questions.push({
            type: 'input',
            name: 'author',
            message: 'Who is the author?',
            filter: (authors) => authors
                .split(',')
                .map((author) => author.trim())
                .filter(Boolean),
            validate: lengthValidator,
        });
    }
    if (!options.entry) {
        questions.push({
            type: 'input',
            name: 'entry',
            message: 'What is the changelog message?',
            ...stringValidator,
        });
    }
    if (!options.type) {
        questions.push({
            type: 'list',
            name: 'type',
            message: 'What is the type?',
            choices: ['bug-fix', 'new-feature', 'breaking-change', 'library-upgrade', 'notice'],
        });
    }
    const promptAnswer = questions.length > 0 ? await inquirer_1.default.prompt(questions) : {};
    return { ...options, ...promptAnswer };
}
function toChangeType(type) {
    switch (type) {
        case 'bug-fix':
            return Changelogs.ChangeType.BUG_FIXES;
        case 'new-feature':
            return Changelogs.ChangeType.NEW_FEATURES;
        case 'breaking-change':
            return Changelogs.ChangeType.BREAKING_CHANGES;
        case 'library-upgrade':
            return Changelogs.ChangeType.LIBRARY_UPGRADES;
        case 'notice':
            return Changelogs.ChangeType.NOTICES;
    }
    return null;
}
async function action(options) {
    if (!process.env.CI) {
        options = await checkOrAskForOptions(options);
    }
    if (!options.author.length ||
        !options.entry ||
        !options.package ||
        !options.type ||
        options.pullRequest === true) {
        throw new Error(`Must run with --package <string> --entry <string> --author <string> --pull-request <number> --type <string>`);
    }
    const type = toChangeType(options.type);
    if (!type) {
        throw new Error(`Invalid type: ${chalk_1.default.cyan(options.type)}`);
    }
    const packagePath = path_1.default.join(Directories.getPackagesDir(), options.package, 'CHANGELOG.md');
    if (!(await fs_extra_1.default.pathExists(packagePath))) {
        throw new Error(`Package ${chalk_1.default.green(options.package)} doesn't have changelog file.`);
    }
    const changelog = Changelogs.loadFrom(packagePath);
    const message = options.entry.slice(-1) === '.' ? options.entry : `${options.entry}.`;
    const insertedEntries = await changelog.insertEntriesAsync(options.version, type, null, [
        {
            message,
            pullRequests: options.pullRequest,
            authors: options.author,
        },
    ]);
    if (insertedEntries.length > 0) {
        Logger_1.default.info(`\n➕ Inserted ${chalk_1.default.magenta(options.type)} entry to ${chalk_1.default.green(options.package)}:`);
        insertedEntries.forEach((entry) => {
            Logger_1.default.log('  ', Formatter_1.formatChangelogEntry(Changelogs.getChangeEntryLabel(entry)));
        });
        Logger_1.default.info('\n💾 Saving changelog file...');
        await changelog.saveAsync();
        Logger_1.default.success('\n✅ Successfully inserted new entry.');
    }
    else {
        Logger_1.default.success('\n✅ Specified entry is already there.');
    }
}
exports.default = (program) => {
    program
        .command('add-changelog')
        .alias('ac')
        .description('Adds changelog entry to the package.')
        .option('-p, --package <string>', 'Package name. For example `expo-image-picker` or `unimodules-file-system-interface.')
        .option('-e, --entry <string>', 'Change note to put into the changelog.')
        .option('-a, --author <string>', "GitHub's user name of someone who made this change. Can be passed multiple times.", (value, previous) => previous.concat(value), [])
        .option('-r, --pull-request <number>', 'Pull request number. Can be passed multiple times.', (value, previous) => {
        if (typeof previous === 'boolean') {
            return [parseInt(value, 10)];
        }
        return previous.concat(parseInt(value, 10));
    })
        .option('--no-pull-request', 'If changes were pushed directly to the master.', (value, previous) => {
        // we need to change how no-flag works in commander to be able to pass an array
        if (!value) {
            return [];
        }
        return previous;
    })
        .option('-t, --type <string>', 'Type of change that determines the section into which the entry should be added. Possible options: bug-fix | new-feature | breaking-change | library-upgrade | notice.')
        .option('-v, --version [string]', 'Version in which the change was made.', Changelogs.UNPUBLISHED_VERSION_NAME)
        .asyncAction(action);
};
//# sourceMappingURL=AddChangelog.js.map