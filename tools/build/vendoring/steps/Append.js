"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Append = void 0;
const Task_1 = require("./Task");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
/**
 * A task which will append to files content.
 */
class Append extends Task_1.Task {
    constructor({ source, filePattern, append }) {
        super();
        this.source = source;
        this.filePattern = filePattern;
        this.append = append;
    }
    overrideWorkingDirectory() {
        return this.source;
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        this.logSubStep(`➕ append to ${chalk_1.default.green(this.overrideWorkingDirectory() || '<workingDirectory>')}/${chalk_1.default.yellow(this.filePattern)}`);
        const files = await utils_1.findFiles(workDirectory, this.filePattern);
        await Promise.all(files.map(async (file) => {
            return await fs_extra_1.default.appendFile(file, this.append);
        }));
    }
}
exports.Append = Append;
//# sourceMappingURL=Append.js.map