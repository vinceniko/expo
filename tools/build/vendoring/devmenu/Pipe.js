"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pipe = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
/**
 * A simple task executor, which sets the working directory for all task and runs them one by one.
 * Moreover it can start only tasks for the selected platform.
 */
class Pipe {
    constructor() {
        this.platformSpecificTasks = [];
    }
    setWorkingDirectory(workingDirectory) {
        this.workingDirectory = workingDirectory;
        return this;
    }
    /**
     * This method accepts two types of arguments:
     * - string - indicates the platform on which the following tasks will be registered
     * - task
     *
     * ```
     * Pipe().addSteps(
     *    T1,
     *    T2,
     *  'android',
     *    T3A,
     *  'ios',
     *    T3I,
     *  'all',
     *    T4
     * );
     *
     * will resolve to:
     * - if platform = 'all' -> [T1, T2, T3A, T3I, T4]
     * - if platform = 'ios' -> [T1, T2, T3I, T4]
     * - if platform = 'android' -> [T1, T2, T3A, T4]
     * ```
     */
    addSteps(...tasks) {
        let currentPlatform = 'all';
        tasks.forEach((task) => {
            if (typeof task === 'string') {
                currentPlatform = task;
                return;
            }
            if (Array.isArray(task)) {
                this.platformSpecificTasks.push(...task.map((t) => ({ platform: currentPlatform, task: t })));
                return;
            }
            this.platformSpecificTasks.push({ platform: currentPlatform, task });
        });
        return this;
    }
    async start(platform) {
        Logger_1.default.debug(`Staring pipe for platform = ${chalk_1.default.green(platform)}`);
        Logger_1.default.debug(`${chalk_1.default.green('<workingDirectory>')} = ${chalk_1.default.yellow(this.workingDirectory || '')}`);
        Logger_1.default.debug();
        const tasks = this.platformSpecificTasks
            .filter((platformSpecificStep) => {
            const { platform: stepPlatform } = platformSpecificStep;
            if (platform === 'all' || stepPlatform === 'all') {
                return true;
            }
            if (platform === stepPlatform) {
                return true;
            }
            return false;
        })
            .map(({ task }) => task);
        for (const task of tasks) {
            if (this.workingDirectory) {
                task.setWorkingDirectory(this.workingDirectory);
            }
            await task.start();
        }
    }
}
exports.Pipe = Pipe;
//# sourceMappingURL=Pipe.js.map