"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expotools_1 = require("../expotools");
async function action(sdkVersion) {
    if (!sdkVersion) {
        throw new Error('SDK Version is required');
    }
    await expotools_1.TestSuite.publishVersionedTestSuiteAsync(sdkVersion);
}
exports.default = (program) => {
    program
        .command('publish-versioned-test-suite [sdkVersion]')
        .description('Publishes Test Suite for a specific SDK version')
        .asyncAction(action);
};
//# sourceMappingURL=PublishVersionedTestSuiteCommand.js.map