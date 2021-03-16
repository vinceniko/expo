"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOSLogStream = exports.getSimulatorLogProcess = exports.launchSimulatorAppAsync = exports.installSimulatorAppAsync = exports.startSimulatorAsync = void 0;
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
/**
 * Starts an arbitrary iOS simulator so that simctl can reference a "booted" simulator.
 */
async function startSimulatorAsync() {
    try {
        await spawn_async_1.default('xcrun', ['instruments', '-w', 'iPhone X (11.2) [']);
    }
    catch (e) {
        // Instruments exits with an expected error
        if (!e.stderr.includes('Instruments Usage Error')) {
            throw e;
        }
    }
}
exports.startSimulatorAsync = startSimulatorAsync;
async function installSimulatorAppAsync(simulatorId, archivePath) {
    try {
        await spawn_async_1.default('xcrun', ['simctl', 'install', simulatorId, archivePath]);
    }
    catch (e) {
        let error = new Error(e.stderr);
        error.status = e.status;
        throw error;
    }
}
exports.installSimulatorAppAsync = installSimulatorAppAsync;
async function launchSimulatorAppAsync(simulatorId, bundleIdentifier) {
    try {
        await spawn_async_1.default('xcrun', ['simctl', 'launch', simulatorId, bundleIdentifier]);
    }
    catch (e) {
        let error = new Error(e.stderr);
        error.status = e.status;
        throw error;
    }
}
exports.launchSimulatorAppAsync = launchSimulatorAppAsync;
function getSimulatorLogProcess(simulatorId, predicate) {
    return child_process_1.spawn('xcrun', [
        'simctl',
        'spawn',
        simulatorId,
        'log',
        'stream',
        '--style',
        'json',
        ...(predicate ? ['--predicate', predicate] : []),
    ], {
        stdio: ['ignore', 'pipe', 'inherit'],
    });
}
exports.getSimulatorLogProcess = getSimulatorLogProcess;
class IOSLogStream extends stream_1.Transform {
    constructor(options) {
        super({ ...options, objectMode: true });
    }
    _transform(data, encoding, callback) {
        // In practice, we receive each log entry as a separate chunk and can test if they are valid,
        // JSON-formatted log entries
        let entry;
        try {
            entry = JSON.parse(data.toString('utf8'));
        }
        catch (e) { }
        if (entry === null || entry === void 0 ? void 0 : entry.eventMessage) {
            this.push(entry);
        }
        callback();
    }
}
exports.IOSLogStream = IOSLogStream;
//# sourceMappingURL=IOSSimulator.js.map