"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLocalAndroidAndRunTestAsync = exports.runAndroidTestsAsync = void 0;
const path_1 = __importDefault(require("path"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Directories_1 = require("./Directories");
const ANDROID_DIR = path_1.default.join(Directories_1.getExpoRepositoryRootDir(), 'android');
async function runAndroidTestsAsync(pathToAppApk, pathToTestApk) {
    await spawn_async_1.default('gcloud', [
        'firebase',
        'test',
        'android',
        'run',
        '--type',
        'instrumentation',
        '--app',
        pathToAppApk,
        '--test',
        pathToTestApk,
        '--device',
        'model=Nexus6,version=25,locale=en,orientation=portrait',
    ], {
        stdio: 'inherit',
    });
}
exports.runAndroidTestsAsync = runAndroidTestsAsync;
async function buildLocalAndroidAndRunTestAsync(env = {}) {
    await spawn_async_1.default('./gradlew', [':app:assembleDebug'], {
        cwd: ANDROID_DIR,
        env: {
            ...process.env,
            ...env,
        },
    });
    await spawn_async_1.default('./gradlew', [':app:assembleDebugAndroidTest'], {
        cwd: ANDROID_DIR,
        env: {
            ...process.env,
            ...env,
        },
    });
    return await runAndroidTestsAsync(path_1.default.join(ANDROID_DIR, 'app/build/outputs/apk/debug/app-debug.apk'), path_1.default.join(ANDROID_DIR, 'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'));
}
exports.buildLocalAndroidAndRunTestAsync = buildLocalAndroidAndRunTestAsync;
//# sourceMappingURL=FirebaseTestLab.js.map