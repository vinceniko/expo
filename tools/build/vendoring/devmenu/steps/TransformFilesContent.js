"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameIOSSymbols = exports.prefixPackage = exports.TransformFilesContent = void 0;
const Task_1 = require("./Task");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
/**
 * A task which will transformed files content.
 * Firstly, it's searching for all files which matched the `filePattern` in the working directory.
 * Then it'll find the provided pattern and replace it with a new value.
 */
class TransformFilesContent extends Task_1.Task {
    constructor({ source, filePattern, find, replace }) {
        super();
        this.source = source;
        this.filePattern = filePattern;
        this.find = new RegExp(find, 'gm');
        this.replace = replace;
    }
    overrideWorkingDirectory() {
        return this.source;
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        this.logSubStep(`🔄 find ${chalk_1.default.yellow(this.find.toString())} in ${chalk_1.default.green(this.overrideWorkingDirectory() || '<workingDirectory>')}/${chalk_1.default.yellow(this.filePattern)} and replace with ${chalk_1.default.magenta(this.replace)}`);
        const files = await utils_1.findFiles(workDirectory, this.filePattern);
        await Promise.all(files.map(async (file) => {
            const content = await fs_extra_1.default.readFile(file, 'utf8');
            const transformedContent = content.replace(this.find, this.replace);
            return await fs_extra_1.default.writeFile(file, transformedContent, 'utf8');
        }));
    }
}
exports.TransformFilesContent = TransformFilesContent;
exports.prefixPackage = ({ packageName, prefix, }) => {
    return new TransformFilesContent({
        filePattern: path_1.default.join('android', '**', '*.@(java|kt)'),
        find: packageName,
        replace: `${prefix}.${packageName}`,
    });
};
exports.renameIOSSymbols = (settings) => {
    return new TransformFilesContent({
        ...settings,
        filePattern: path_1.default.join('ios', '**', '*.@(h|m)'),
    });
};
//# sourceMappingURL=TransformFilesContent.js.map