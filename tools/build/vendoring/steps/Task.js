"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const Logger_1 = __importDefault(require("../../Logger"));
const utils_1 = require("../utils");
/**
 * An base class for all task.
 * It provides a simple task luncher, log utils and path to working directory.
 */
class Task {
    /**
     * Tasks can contain multiple steps. This function provides a consistent way to log information about each step.
     * @param message
     */
    logSubStep(message) {
        Logger_1.default.info(`> ${message}`);
    }
    /**
     * A function which provides a consistent way of printing debug information inside a task.
     * @param message which will be printed using debug log level.
     */
    logDebugInfo(message) {
        if (typeof message === 'string') {
            Logger_1.default.debug(`  ${message}`);
        }
        else {
            Logger_1.default.debug(`  ${message.join('\n    ')}`);
        }
    }
    /**
     * We want to have a way to change working directory using task's settings.
     * For example, we could run pipe in the temp directory but one task from it in the repo.
     * It's ignored if undefined was returned.
     * @returns the override working directory for task.
     */
    overrideWorkingDirectory() {
        return;
    }
    /**
     * @returns the absolute path to working directory for task based on overrideWorkDirectory().
     */
    getWorkingDirectory() {
        const overrideValue = this.overrideWorkingDirectory();
        if (overrideValue) {
            return utils_1.toRepoPath(overrideValue);
        }
        return utils_1.toRepoPath(this.workingDirectory);
    }
    /**
     * Sets the working directory for the task.
     * @param workingDirectory
     */
    setWorkingDirectory(workingDirectory) {
        this.workingDirectory = workingDirectory;
    }
    /**
     * A method that starts the task. It provides error handling.
     */
    async start() {
        try {
            await this.execute();
        }
        catch (e) {
            Logger_1.default.error(e);
            return;
        }
    }
}
exports.Task = Task;
//# sourceMappingURL=Task.js.map