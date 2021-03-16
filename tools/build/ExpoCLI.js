"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExpoCliAsync = void 0;
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Constants_1 = require("./Constants");
async function runExpoCliAsync(command, args = [], options = {}) {
    let configArgs = options.root ? ['--config', path_1.default.resolve(options.root, 'app.json')] : [];
    // Don't handle SIGINT/SIGTERM in this process...defer to expo-cli
    process_1.default.on('SIGINT', () => { });
    process_1.default.on('SIGTERM', () => { });
    await spawn_async_1.default('expo', [command, ...args, ...configArgs], {
        cwd: options.cwd || options.root || Constants_1.EXPO_DIR,
        stdio: options.stdio || 'inherit',
        env: {
            ...process_1.default.env,
            EXPO_NO_DOCTOR: 'true',
        },
    });
}
exports.runExpoCliAsync = runExpoCliAsync;
//# sourceMappingURL=ExpoCLI.js.map