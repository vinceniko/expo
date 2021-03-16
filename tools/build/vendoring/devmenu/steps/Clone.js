"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clone = void 0;
const Task_1 = require("./Task");
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
/**
 * A task which will clone repository into the provided destination or into the working directory.
 */
class Clone extends Task_1.Task {
    constructor({ url, destination, ...options }) {
        super();
        this.url = url;
        this.destination = destination;
        this.options = options;
    }
    overrideWorkingDirectory() {
        return this.destination;
    }
    async execute() {
        const workDirectory = this.getWorkingDirectory();
        this.logSubStep(`🧹 remove ${chalk_1.default.yellow(this.overrideWorkingDirectory() || '<workingDirectory>')}`);
        await fs_extra_1.default.remove(workDirectory);
        this.logSubStep(`📩 clone repo ${chalk_1.default.green(this.url)} into ${chalk_1.default.yellow(this.overrideWorkingDirectory() || '<workingDirectory>')}`);
        const cloneArguments = this.cloneArguments();
        this.logDebugInfo(`run git clone ${cloneArguments.join(' ')}`);
        await spawn_async_1.default('git', ['clone', ...cloneArguments, this.url, workDirectory]);
        if ('commit' in this.options) {
            this.logDebugInfo(`run git checkout ${this.options.commit}`);
            await spawn_async_1.default('git', ['checkout', this.options.commit], { cwd: workDirectory });
        }
    }
    cloneArguments() {
        // if a branch or tag was provided, we don't need to clone the whole repo.
        const args = ['--depth', '1'];
        if ('branch' in this.options) {
            args.push('--branch', this.options.branch);
        }
        else if ('tag' in this.options) {
            args.push('--branch', this.options.tag);
        }
        else if ('commit' in this.options) {
            return [];
        }
        return args;
    }
}
exports.Clone = Clone;
//# sourceMappingURL=Clone.js.map