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
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const Directories = __importStar(require("../Directories"));
const AndroidNativeUnitTests_1 = require("./AndroidNativeUnitTests");
async function thisAction({ platform, type = 'local', }) {
    if (!platform) {
        console.log(chalk_1.default.yellow("You haven't specified platform to run unit tests for!"));
        const result = await inquirer_1.default.prompt([
            {
                name: 'platform',
                type: 'list',
                message: 'Which platform do you want to run native tests ?',
                choices: ['android', 'ios', 'both'],
                default: 'android',
            },
        ]);
        platform = result.platform;
    }
    const runAndroid = platform === 'android' || platform === 'both';
    const runIos = platform === 'ios' || platform === 'both';
    if (runIos) {
        try {
            await spawn_async_1.default('fastlane scan', undefined, {
                cwd: Directories.getIosDir(),
                stdio: 'inherit',
            });
        }
        catch (e) {
            console.log('Something went wrong:');
            console.log(e);
        }
    }
    if (runAndroid) {
        await AndroidNativeUnitTests_1.androidNativeUnitTests({ type });
    }
}
exports.default = (program) => {
    program
        .command('native-unit-tests')
        .option('-p, --platform <string>', 'Determine for which platform we should run native tests: android, ios or both')
        .option('-t, --type <string>', 'Type of unit test to run, if supported by this platform. local (default) or instrumented')
        .description('Runs native unit tests for each unimodules that provides them.')
        .asyncAction(thisAction);
};
//# sourceMappingURL=NativeUnitTests.js.map