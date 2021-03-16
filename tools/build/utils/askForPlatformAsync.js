"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
async function askForPlatformAsync(platforms = ['ios', 'android']) {
    if (process.env.CI) {
        throw new Error(`Run with \`--platform <${platforms.join(' | ')}>\`.`);
    }
    if (platforms.length === 1) {
        return platforms[0];
    }
    const { platform } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'platform',
            message: 'For which platform you want to run this script?',
            default: platforms[0],
            choices: platforms,
        },
    ]);
    return platform;
}
exports.default = askForPlatformAsync;
//# sourceMappingURL=askForPlatformAsync.js.map