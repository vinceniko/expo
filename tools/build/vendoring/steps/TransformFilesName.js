"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameIOSFiles = exports.TransformFilesName = void 0;
const TransformFilesContent_1 = require("./TransformFilesContent");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
class TransformFilesName extends TransformFilesContent_1.TransformFilesContent {
    constructor(settings) {
        super(settings);
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        this.logSubStep(`🔄 find ${chalk_1.default.yellow(this.find.toString())} in files names in path ${chalk_1.default.green(this.overrideWorkingDirectory() || '<workingDirectory>')}/${chalk_1.default.yellow(this.filePattern)} and replace with ${chalk_1.default.magenta(this.replace)}`);
        const files = await utils_1.findFiles(workDirectory, this.filePattern);
        await Promise.all(files.map((file) => {
            const fileName = path_1.default.basename(file).replace(this.find, this.replace);
            const parent = path_1.default.dirname(file);
            return fs_extra_1.default.rename(file, path_1.default.join(parent, fileName));
        }));
    }
}
exports.TransformFilesName = TransformFilesName;
function renameIOSFiles({ find, replace, }) {
    return new TransformFilesName({
        filePattern: path_1.default.join('ios', '**', `*${find}*.@(m|h)`),
        find,
        replace,
    });
}
exports.renameIOSFiles = renameIOSFiles;
//# sourceMappingURL=TransformFilesName.js.map