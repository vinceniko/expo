"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTestSuiteOnIOSSimulatorAsync = void 0;
const junit_report_builder_1 = __importDefault(require("junit-report-builder"));
const path_1 = __importDefault(require("path"));
const IOSSimulator = __importStar(require("./IOSSimulator"));
const Log = __importStar(require("./Log"));
const TEST_SUITE_BUNDLE_ID = 'io.expo.testsuite';
const TEST_SUITE_END_SENTINEL = '[TEST-SUITE-END]';
async function runTestSuiteOnIOSSimulatorAsync(simulatorId, archivePath, reportPath) {
    Log.collapsed(`Running test-suite on the iOS simulator`);
    if (!simulatorId) {
        console.log(`Starting a new simulator`);
        await IOSSimulator.startSimulatorAsync();
        simulatorId = 'booted';
    }
    console.log(`Installing test-suite on the simulator`);
    await IOSSimulator.installSimulatorAppAsync(simulatorId, path_1.default.resolve(archivePath));
    console.log(`Streaming logs from the simulator`);
    let resultsPromise = _streamSimulatorLogsAsync(simulatorId);
    console.log(`Launching the test-suite app and waiting for tests to complete`);
    await IOSSimulator.launchSimulatorAppAsync(simulatorId, TEST_SUITE_BUNDLE_ID);
    let results = await resultsPromise;
    if (results.failed === 0) {
        console.log(`😊 All tests passed`);
    }
    else {
        console.error(`😣 ${results.failed} ${results.failed === 1 ? 'test' : 'tests'} failed`);
    }
    if (reportPath) {
        _writeJUnitReport(results, reportPath);
        console.log(`Saved test results to ${reportPath}`);
    }
    return results;
}
exports.runTestSuiteOnIOSSimulatorAsync = runTestSuiteOnIOSSimulatorAsync;
function _streamSimulatorLogsAsync(simulatorId) {
    return new Promise((resolve, reject) => {
        let logProcess = IOSSimulator.getSimulatorLogProcess(simulatorId, '(subsystem == "host.exp.Exponent") && (category == "test")');
        let logStream = new IOSSimulator.IOSLogStream();
        logProcess.stdout.pipe(logStream);
        logStream.on('data', (entry) => {
            // Show the log messages in the CI log
            console.log(entry.eventMessage);
            if (!entry.eventMessage.startsWith(TEST_SUITE_END_SENTINEL)) {
                return;
            }
            try {
                logStream.removeAllListeners('data');
                let resultsJson = entry.eventMessage.substring(TEST_SUITE_END_SENTINEL.length).trim();
                let results = JSON.parse(resultsJson);
                resolve(results);
            }
            catch (e) {
                reject(e);
            }
            finally {
                console.log(`Terminating simulator log stream`);
                logProcess.kill('SIGTERM');
            }
        });
    });
}
function _writeJUnitReport(results, reportPath) {
    let builder = junit_report_builder_1.default.newBuilder();
    // let suite = builder.testSuite().name('Test Suite');
    // TODO: parse the results
    builder.writeTo(reportPath);
}
//# sourceMappingURL=IOSSimulatorTestSuite.js.map