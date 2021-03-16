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
exports.checkEnvironmentTask = void 0;
const chalk_1 = __importDefault(require("chalk"));
const Logger_1 = __importDefault(require("../../Logger"));
const Npm = __importStar(require("../../Npm"));
const TasksRunner_1 = require("../../TasksRunner");
const { cyan } = chalk_1.default;
/**
 * Checks whether the environment allows to proceed with any further tasks.
 */
exports.checkEnvironmentTask = new TasksRunner_1.Task({
    name: 'checkEnvironmentTask',
    required: true,
}, async () => {
    const npmUser = await Npm.whoamiAsync();
    if (!npmUser) {
        Logger_1.default.error('❗️ You must be logged in to NPM to publish packages, please run `npm login` first');
        return TasksRunner_1.Task.STOP;
    }
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);
    if (!teamMembers.includes(npmUser)) {
        Logger_1.default.error(`❗️ You must be in ${cyan(Npm.EXPO_DEVELOPERS_TEAM_NAME)} team to publish packages`);
        return TasksRunner_1.Task.STOP;
    }
});
//# sourceMappingURL=checkEnvironmentTask.js.map