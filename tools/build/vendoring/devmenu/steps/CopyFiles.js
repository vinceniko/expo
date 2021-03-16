"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyFiles = void 0;
const Task_1 = require("./Task");
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
/**
 *  A task which will copy files from `workingDirectory()/subDirectory/filePatterns` to the provided path.
 *
 * It's searching for file names which match `filePatterns` and then it copies them into `to/<matched_part_of_file_name>`.
 * So the `subDirectory` part won't be copied.
 *
 * If for this file structure:
 *
 * ```
 * android/
 *   src/
 *     main.java
 *   lib/
 *     lib.java
 * ```
 *
 * you runs CopyFiles with:
 * ```
 * {
 *   from: 'android',
 *   subDirectory: 'src|lib',
 *   to: 'copied',
 *   filePatterns: '*'
 * }
 * ```
 * you gets:
 * ```
 * android/
 *   src/
 *     main.java
 *   lib/
 *     lib.java
 * lib/
 *   main.java
 *   lib.java
 * ```
 */
class CopyFiles extends Task_1.Task {
    /**
     * Using `from` key, you can override the work directory.
     * @param settings
     */
    constructor({ from, subDirectory, filePattern, to }) {
        super();
        this.from = from;
        this.subDirectory = subDirectory;
        this.to = utils_1.toRepoPath(to);
        if (typeof filePattern === 'string') {
            this.filePattern = [filePattern];
        }
        else {
            this.filePattern = filePattern;
        }
    }
    overrideWorkingDirectory() {
        return this.from;
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        for (const pattern of this.filePattern) {
            const subPath = this.subDirectory
                ? path_1.default.join(workDirectory, this.subDirectory)
                : workDirectory;
            this.logSubStep(`📝 copy ${chalk_1.default.green(this.from || '<workingDirectory>')}/${chalk_1.default.green(this.subDirectory ? this.subDirectory + '/' : '')}${chalk_1.default.yellow(pattern)} into ${chalk_1.default.magenta(this.to)}`);
            const files = await utils_1.findFiles(subPath, pattern);
            await Promise.all(files.map(async (file) => {
                const relativeFilePath = path_1.default.relative(subPath, file);
                const destinationFullPath = path_1.default.join(this.to, relativeFilePath);
                await fs_extra_1.default.mkdirs(path_1.default.dirname(destinationFullPath));
                return await fs_extra_1.default.copy(file, destinationFullPath);
            }));
        }
    }
}
exports.CopyFiles = CopyFiles;
//# sourceMappingURL=CopyFiles.js.map