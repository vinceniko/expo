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
exports.publishVersionedTestSuiteAsync = void 0;
const path_1 = __importDefault(require("path"));
const json_file_1 = __importDefault(require("@expo/json-file"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Directories = __importStar(require("./Directories"));
const Log = __importStar(require("./Log"));
const XDL = __importStar(require("./XDL"));
const CI_USERNAME = 'exponent_ci_bot';
const TEST_SUITE_DIR = path_1.default.join(Directories.getExpoRepositoryRootDir(), 'apps', 'test-suite');
async function _installTestSuiteDependenciesAsync() {
    Log.collapsed(`Installing test-suite and its dependencies...`);
    // This will install test-suite, expo, and react-native in the workspace root
    await spawn_async_1.default('yarn', ['install'], {
        cwd: Directories.getExpoRepositoryRootDir(),
        stdio: 'inherit',
    });
}
async function _publishTestSuiteNoCacheAsync(id) {
    await _installTestSuiteDependenciesAsync();
    Log.collapsed('Modifying slug...');
    let appJsonFile = new json_file_1.default(path_1.default.join(TEST_SUITE_DIR, 'app.json'));
    let appJson = (await appJsonFile.readAsync());
    appJson.expo.slug = id;
    await appJsonFile.writeAsync(appJson);
    await XDL.publishProjectWithExpoCliAsync(TEST_SUITE_DIR);
}
async function publishVersionedTestSuiteAsync(sdkVersion) {
    let appJsonFile = new json_file_1.default(path_1.default.join(TEST_SUITE_DIR, 'app.json'));
    const appJson = (await appJsonFile.readAsync());
    appJson.expo.sdkVersion = sdkVersion;
    await appJsonFile.writeAsync(appJson);
    const id = `test-suite-sdk-${sdkVersion}`.replace(/\./g, '-');
    const url = `exp://exp.host/@${CI_USERNAME}/${id}`;
    await _publishTestSuiteNoCacheAsync(id);
    console.log(`Published test-suite to ${url}`);
}
exports.publishVersionedTestSuiteAsync = publishVersionedTestSuiteAsync;
//# sourceMappingURL=TestSuite.js.map