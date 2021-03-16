"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerBatch = exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = __importDefault(require("readline"));
const CONSOLE_RESOLVER = (level, color, args) => {
    return console[level](...(color ? args.map((arg) => color(arg)) : args));
};
/**
 * Basic logger just for simple console logging with colored output.
 */
class Logger {
    constructor(resolver = CONSOLE_RESOLVER) {
        this.resolver = resolver;
    }
    verbose(...args) {
        this.resolver('debug', chalk_1.default.dim, args);
    }
    debug(...args) {
        this.resolver('debug', chalk_1.default.gray, args);
    }
    log(...args) {
        this.resolver('log', null, args);
    }
    success(...args) {
        this.resolver('log', chalk_1.default.green, args);
    }
    info(...args) {
        this.resolver('info', chalk_1.default.cyan, args);
    }
    warn(...args) {
        this.resolver('warn', chalk_1.default.yellow.bold, args);
    }
    error(...args) {
        this.resolver('error', chalk_1.default.red.bold, args);
    }
    batch() {
        return new LoggerBatch(this.resolver);
    }
    clearLine() {
        readline_1.default.moveCursor(process.stdout, 0, -1);
        readline_1.default.clearLine(process.stdout, 0);
    }
}
exports.Logger = Logger;
/**
 * Batched logger, it batches all logs until they're flushed.
 * Useful for asynchronous simultaneous operations to preserve logs order.
 */
class LoggerBatch extends Logger {
    constructor(parentResolver = CONSOLE_RESOLVER) {
        super((level, color, args) => {
            this.batchedLogs.push([level, color, args]);
        });
        this.parentResolver = parentResolver;
        this.batchedLogs = [];
        this.batchedLogs = [];
    }
    flush() {
        this.batchedLogs.forEach(([level, color, args]) => this.parentResolver(level, color, args));
        this.batchedLogs.length = 0;
    }
}
exports.LoggerBatch = LoggerBatch;
exports.default = new Logger();
//# sourceMappingURL=Logger.js.map