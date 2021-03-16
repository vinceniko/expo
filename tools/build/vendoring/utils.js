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
exports.findFiles = exports.toRepoPath = void 0;
const Directories = __importStar(require("../Directories"));
const path_1 = __importDefault(require("path"));
const glob_promise_1 = __importDefault(require("glob-promise"));
/**
 * @param pathToConvert
 * @returns an absolute path to provided location in the expo repo or provided path if it's an absolute path.
 */
function toRepoPath(pathToConvert) {
    if (path_1.default.isAbsolute(pathToConvert)) {
        return pathToConvert;
    }
    return path_1.default.join(Directories.getExpoRepositoryRootDir(), pathToConvert);
}
exports.toRepoPath = toRepoPath;
async function findFiles(directory, filePattern) {
    return await glob_promise_1.default(path_1.default.join(directory, filePattern));
}
exports.findFiles = findFiles;
//# sourceMappingURL=utils.js.map