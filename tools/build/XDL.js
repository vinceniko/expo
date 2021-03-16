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
exports.publishProjectWithExpoCliAsync = void 0;
const process_1 = __importDefault(require("process"));
const ExpoCLI = __importStar(require("./ExpoCLI"));
const Log = __importStar(require("./Log"));
/**
 * Uses the installed version of `expo-cli` to publish a project.
 */
async function publishProjectWithExpoCliAsync(projectRoot, options = {}) {
    var _a, _b;
    process_1.default.env.EXPO_NO_DOCTOR = '1';
    const username = ((_a = options.userpass) === null || _a === void 0 ? void 0 : _a.username) || process_1.default.env.EXPO_CI_ACCOUNT_USERNAME;
    const password = ((_b = options.userpass) === null || _b === void 0 ? void 0 : _b.password) || process_1.default.env.EXPO_CI_ACCOUNT_PASSWORD;
    if (username && password) {
        Log.collapsed('Logging in...');
        await ExpoCLI.runExpoCliAsync('login', ['-u', username, '-p', password]);
    }
    else {
        Log.collapsed('Expo username and password not specified. Using currently logged-in account.');
    }
    Log.collapsed('Publishing...');
    const publishArgs = [];
    if (process_1.default.env.CI) {
        publishArgs.push('--max-workers', '1');
    }
    await ExpoCLI.runExpoCliAsync('publish', publishArgs, {
        root: projectRoot,
    });
}
exports.publishProjectWithExpoCliAsync = publishProjectWithExpoCliAsync;
//# sourceMappingURL=XDL.js.map