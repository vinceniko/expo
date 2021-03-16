"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = exports.TaskRunner = exports.TaskError = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const Git_1 = __importDefault(require("./Git"));
const Logger_1 = __importDefault(require("./Logger"));
/**
 * Class of error that might be thrown when running tasks.
 */
class TaskError extends Error {
    constructor(task, error) {
        super(error.message);
        this.task = task;
        this.stderr = error.stderr;
        this.stack = error.stack;
    }
}
exports.TaskError = TaskError;
/**
 * Task runner, as its name suggests, runs given task. One task can depend on other tasks
 * and the runner makes sure they all are being run. Runner also provides an easy way to
 * backup and restore tasks' state.
 */
class TaskRunner {
    constructor(descriptor) {
        this.backupFilePath = null;
        this.backupExpirationTime = 60 * 60 * 1000;
        this.validateBackup = () => true;
        this.shouldUseBackup = () => true;
        this.restoreBackup = () => { };
        this.createBackupData = () => null;
        const { tasks, ...rest } = descriptor;
        this.tasks = [].concat(tasks);
        this.resolvedTasks = resolveTasksList(this.tasks);
        Object.assign(this, rest);
    }
    /**
     * Resolves to a boolean value determining whether the backup file exists.
     */
    async backupExistsAsync() {
        if (!this.backupFilePath) {
            return false;
        }
        try {
            await fs_extra_1.default.access(this.backupFilePath, fs_extra_1.default.constants.R_OK);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Returns action's backup if it exists and is still valid, `null` otherwise.
     */
    async getBackupAsync() {
        var _a;
        if (!this.backupFilePath || !(await this.backupExistsAsync())) {
            return null;
        }
        const backup = await json_file_1.default.readAsync(this.backupFilePath);
        if (!(await this.isBackupValid(backup))) {
            await ((_a = this.backupValidationFailed) === null || _a === void 0 ? void 0 : _a.call(this, backup));
            return null;
        }
        return !this.shouldUseBackup || (await this.shouldUseBackup(backup)) ? backup : null;
    }
    /**
     * Validates backup compatibility with options passed to the command.
     */
    async isBackupValid(backup) {
        var _a, _b;
        const tasksComparator = (a, b) => a === b.name;
        if (Date.now() - backup.timestamp < this.backupExpirationTime &&
            arraysCompare(backup.resolvedTasks, this.resolvedTasks, tasksComparator) &&
            arraysCompare(backup.tasks, this.tasks, tasksComparator)) {
            return (_b = (await ((_a = this.validateBackup) === null || _a === void 0 ? void 0 : _a.call(this, backup)))) !== null && _b !== void 0 ? _b : true;
        }
        return false;
    }
    /**
     * Saves backup of tasks state.
     */
    async saveBackup(task, ...args) {
        if (!this.backupFilePath) {
            return;
        }
        const data = await this.createBackupData(task, ...args);
        const backup = {
            timestamp: Date.now(),
            tasks: this.tasks.map((task) => task.name),
            resolvedTasks: this.resolvedTasks.map((task) => task.name),
            lastTask: task.name,
            data,
        };
        await fs_extra_1.default.outputFile(this.backupFilePath, JSON.stringify(backup, null, 2));
    }
    /**
     * Removes backup file if specified. Must be synchronous.
     */
    invalidateBackup() {
        if (this.backupFilePath) {
            fs_extra_1.default.removeSync(this.backupFilePath);
        }
    }
    /**
     * Restores backup if possible and executes tasks until they stop, throw or finish. Re-throws task errors.
     */
    async runAsync(...args) {
        var _a, _b, _c;
        const backup = await this.getBackupAsync();
        const startingIndex = backup
            ? this.resolvedTasks.findIndex((task) => task.name === backup.lastTask) + 1
            : 0;
        if (backup) {
            await this.restoreBackup(backup, ...args);
        }
        // Filter tasks to run: required ones and all those after last backup.
        const tasks = this.resolvedTasks.filter((task, taskIndex) => {
            return task.required || taskIndex >= startingIndex;
        });
        let nextArgs = args;
        for (const task of tasks) {
            try {
                const result = await ((_a = task.taskFunction) === null || _a === void 0 ? void 0 : _a.call(task, ...nextArgs));
                // The task has stopped further tasks execution.
                if (result === Task.STOP) {
                    break;
                }
                if (Array.isArray(result)) {
                    nextArgs = result;
                }
                // Stage declared files in local repository. This is also a part of the backup.
                await Git_1.default.addFilesAsync(task.filesToStage);
            }
            catch (error) {
                // Discard unstaged changes in declared files.
                await Git_1.default.discardFilesAsync(task.filesToStage);
                (_b = this.taskFailed) === null || _b === void 0 ? void 0 : _b.call(this, task, error);
                throw new TaskError(task, error);
            }
            (_c = this.taskSucceeded) === null || _c === void 0 ? void 0 : _c.call(this, task);
            if (task.backupable) {
                // Make a backup after each successful backupable task.
                await this.saveBackup(task, ...args);
            }
        }
        // If we reach here - we're done and backup should be invalidated.
        this.invalidateBackup();
        return nextArgs;
    }
    /**
     * Same as `runAsync` but handles caught errors and calls `process.exit`.
     */
    async runAndExitAsync(...args) {
        try {
            await this.runAsync(...args);
            process.exit(0);
        }
        catch (error) {
            Logger_1.default.error();
            if (error instanceof TaskError) {
                Logger_1.default.error(`💥 Execution failed for task ${chalk_1.default.cyan(error.task.name)}.`);
            }
            Logger_1.default.error('💥 Error:', error.message);
            if (error.stack) {
                const stack = error.stack.split(`${error.message}\n`);
                Logger_1.default.debug(stack[1]);
            }
            error.stderr && Logger_1.default.error('💥 stderr output:\n', chalk_1.default.reset(error.stderr));
            process.exit(1);
        }
    }
}
exports.TaskRunner = TaskRunner;
class Task {
    constructor(descriptor, taskFunction) {
        this.dependsOn = [];
        this.filesToStage = [];
        this.required = false;
        this.backupable = true;
        if (typeof descriptor === 'string') {
            this.name = descriptor;
        }
        else {
            const { name, dependsOn, filesToStage, required, backupable } = descriptor;
            this.name = name;
            this.dependsOn = dependsOn ? [].concat(dependsOn) : [];
            this.filesToStage = filesToStage ? [].concat(filesToStage) : [];
            this.required = required !== null && required !== void 0 ? required : this.required;
            this.backupable = backupable !== null && backupable !== void 0 ? backupable : this.backupable;
        }
        this.taskFunction = taskFunction;
    }
}
exports.Task = Task;
Task.STOP = Symbol();
function resolveTasksList(tasks) {
    const list = new Set();
    function iterateThroughDependencies(task) {
        for (const dependency of task.dependsOn) {
            iterateThroughDependencies(dependency);
        }
        list.add(task);
    }
    tasks.forEach((task) => iterateThroughDependencies(task));
    return [...list];
}
function arraysCompare(arr1, arr2, comparator = (a, b) => a === b) {
    return arr1.length === arr2.length && arr1.every((item, index) => comparator(item, arr2[index]));
}
//# sourceMappingURL=TasksRunner.js.map