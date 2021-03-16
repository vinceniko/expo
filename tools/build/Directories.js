"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppsDir = exports.getVersionedReactNativeIosDir = exports.getReactNativeSubmoduleDir = exports.getTemplatesDir = exports.getAndroidDir = exports.getIosDir = exports.getPackagesDir = exports.getBinDir = exports.getExpotoolsDir = exports.getExpoHomeJSDir = exports.getExpoRepositoryRootDir = void 0;
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
function getExpoRepositoryRootDir() {
    // EXPO_ROOT_DIR is set locally by direnv
    return process_1.default.env.EXPO_ROOT_DIR || path_1.default.join(__dirname, '..', '..');
}
exports.getExpoRepositoryRootDir = getExpoRepositoryRootDir;
function getExpoHomeJSDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'home');
}
exports.getExpoHomeJSDir = getExpoHomeJSDir;
function getExpotoolsDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'tools');
}
exports.getExpotoolsDir = getExpotoolsDir;
function getBinDir() {
    return path_1.default.join(getExpotoolsDir(), 'bin');
}
exports.getBinDir = getBinDir;
function getPackagesDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'packages');
}
exports.getPackagesDir = getPackagesDir;
function getIosDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'ios');
}
exports.getIosDir = getIosDir;
function getAndroidDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'android');
}
exports.getAndroidDir = getAndroidDir;
function getTemplatesDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'templates');
}
exports.getTemplatesDir = getTemplatesDir;
function getReactNativeSubmoduleDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'react-native-lab', 'react-native');
}
exports.getReactNativeSubmoduleDir = getReactNativeSubmoduleDir;
function getVersionedReactNativeIosDir() {
    return path_1.default.join(getIosDir(), 'versioned-react-native');
}
exports.getVersionedReactNativeIosDir = getVersionedReactNativeIosDir;
function getAppsDir() {
    return path_1.default.join(getExpoRepositoryRootDir(), 'apps');
}
exports.getAppsDir = getAppsDir;
//# sourceMappingURL=Directories.js.map