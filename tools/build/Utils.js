"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayize = exports.searchFilesAsync = exports.execAll = exports.retryAsync = exports.filterAsync = exports.sleepAsync = exports.deepCloneObject = exports.spawnJSONCommandAsync = exports.spawnAsync = void 0;
const glob_promise_1 = __importDefault(require("glob-promise"));
const chalk_1 = __importDefault(require("chalk"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Constants_1 = require("./Constants");
/**
 * Asynchronously spawns a process with given command, args and options. Working directory is set to repo's root by default.
 */
function spawnAsync(command, args = [], options = {}) {
    return spawn_async_1.default(command, args, {
        env: { ...process.env },
        cwd: Constants_1.EXPO_DIR,
        ...options,
    });
}
exports.spawnAsync = spawnAsync;
/**
 * Does the same as `spawnAsync` but parses the output to JSON object.
 */
async function spawnJSONCommandAsync(command, args = [], options = {}) {
    const child = await spawnAsync(command, args, options);
    try {
        return JSON.parse(child.stdout);
    }
    catch (e) {
        e.message +=
            '\n' + chalk_1.default.red('Cannot parse this output as JSON: ') + chalk_1.default.yellow(child.stdout.trim());
        throw e;
    }
}
exports.spawnJSONCommandAsync = spawnJSONCommandAsync;
/**
 * Deeply clones an object. It's used to make a backup of home's `app.json` file.
 */
function deepCloneObject(object) {
    return JSON.parse(JSON.stringify(object));
}
exports.deepCloneObject = deepCloneObject;
/**
 * Waits given amount of time (in milliseconds).
 */
function sleepAsync(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
exports.sleepAsync = sleepAsync;
/**
 * Filters an array asynchronously.
 */
async function filterAsync(arr, filter) {
    const results = await Promise.all(arr.map(filter));
    return arr.filter((item, index) => results[index]);
}
exports.filterAsync = filterAsync;
/**
 * Retries executing the function with given interval and with given retry limit.
 * It resolves immediately once the callback returns anything else than `undefined`.
 */
async function retryAsync(interval, limit, callback) {
    return new Promise((resolve) => {
        let count = 0;
        const timeoutCallback = async () => {
            const result = await callback();
            if (result !== undefined) {
                resolve(result);
                return;
            }
            if (++count < limit) {
                setTimeout(timeoutCallback, interval);
            }
            else {
                resolve(undefined);
            }
        };
        timeoutCallback();
    });
}
exports.retryAsync = retryAsync;
/**
 * Executes regular expression against a string until the last match is found.
 */
function execAll(rgx, str, index = 0) {
    const globalRgx = new RegExp(rgx.source, 'g' + rgx.flags.replace('g', ''));
    const matches = [];
    let match;
    while ((match = globalRgx.exec(str))) {
        matches.push(match[index]);
    }
    return matches;
}
exports.execAll = execAll;
/**
 * Searches for files matching given glob patterns.
 */
async function searchFilesAsync(rootPath, patterns, options) {
    const files = await Promise.all(arrayize(patterns).map((pattern) => glob_promise_1.default(pattern, {
        cwd: rootPath,
        nodir: true,
        ...options,
    })));
    return new Set([].concat(...files));
}
exports.searchFilesAsync = searchFilesAsync;
/**
 * Ensures the value is an array.
 */
function arrayize(value) {
    if (Array.isArray(value)) {
        return value;
    }
    return value != null ? [value] : [];
}
exports.arrayize = arrayize;
//# sourceMappingURL=Utils.js.map