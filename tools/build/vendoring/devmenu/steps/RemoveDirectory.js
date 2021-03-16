"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveDirectory = void 0;
const Task_1 = require("./Task");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * A task which will remove the working directory.
 */
class RemoveDirectory extends Task_1.Task {
    constructor({ target }) {
        super();
        this.target = target;
    }
    overrideWorkingDirectory() {
        return this.target;
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        this.logSubStep(`🧹 remove ${chalk_1.default.yellow(this.overrideWorkingDirectory() || '<workingDirectory>')}`);
        return await fs_extra_1.default.remove(workDirectory);
    }
}
exports.RemoveDirectory = RemoveDirectory;
//# sourceMappingURL=RemoveDirectory.js.map