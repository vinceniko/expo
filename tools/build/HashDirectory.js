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
exports.hashDirectoryWithVersionsAsync = exports.hashDirectoryAsync = exports.hashFilesAsync = exports.getListOfFilesAsync = void 0;
const globby_1 = __importDefault(require("globby"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const hash_files_1 = __importDefault(require("hash-files"));
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const Directories = __importStar(require("./Directories"));
async function getListOfFilesAsync(directory) {
    let expoGitignore = fs_1.default.readFileSync(path_1.default.join(Directories.getExpoRepositoryRootDir(), '.gitignore'), 'utf8');
    let directoryGitignore = '';
    try {
        directoryGitignore = fs_1.default.readFileSync(path_1.default.join(directory, '.gitignore'), 'utf8');
    }
    catch (e) {
        // Don't worry if we can't find this gitignore
    }
    let gitignoreLines = [...expoGitignore.split('\n'), ...directoryGitignore.split('\n')].filter((line) => {
        return lodash_1.default.trim(line).length > 0 && !lodash_1.default.trim(line).startsWith('#');
    });
    let gitignoreGlobPatterns = [];
    gitignoreLines.forEach((line) => {
        // Probably doesn't cover every gitignore possiblity but works better than the gitignore-to-glob
        // package on npm
        let firstCharacter = '';
        if (line.startsWith('!')) {
            line = line.substring(1);
        }
        else {
            firstCharacter = '!';
        }
        if (line.startsWith('/')) {
            line = line.substring(1);
        }
        gitignoreGlobPatterns.push(firstCharacter + line);
        gitignoreGlobPatterns.push(firstCharacter + line + '/**');
        gitignoreGlobPatterns.push(firstCharacter + '/**' + line);
        gitignoreGlobPatterns.push(firstCharacter + '/**' + line + '/**');
    });
    let files = await globby_1.default(['**', ...gitignoreGlobPatterns], {
        cwd: directory,
    });
    return files.map((file) => path_1.default.resolve(directory, file));
}
exports.getListOfFilesAsync = getListOfFilesAsync;
async function hashFilesAsync(options) {
    return new Promise((resolve, reject) => {
        hash_files_1.default(options, (error, hash) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(hash);
            }
        });
    });
}
exports.hashFilesAsync = hashFilesAsync;
async function hashDirectoryAsync(directory) {
    let files = await getListOfFilesAsync(directory);
    let hash = await hashFilesAsync({
        files,
        noGlob: true,
    });
    return hash;
}
exports.hashDirectoryAsync = hashDirectoryAsync;
async function hashDirectoryWithVersionsAsync(directory) {
    // Add Node and Yarn versions to the hash
    let yarnVersion = (await spawn_async_1.default('yarn', ['--version'])).stdout;
    let metadataFilename = path_1.default.join(directory, 'HASH_DIRECTORY_METADATA');
    fs_1.default.writeFileSync(metadataFilename, `NODE_VERSION=${process.version}
YARN_VERSION=${yarnVersion}`);
    let hash = await hashDirectoryAsync(directory);
    fs_1.default.unlinkSync(metadataFilename);
    return hash;
}
exports.hashDirectoryWithVersionsAsync = hashDirectoryWithVersionsAsync;
//# sourceMappingURL=HashDirectory.js.map