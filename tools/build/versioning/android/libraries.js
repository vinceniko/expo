"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJavaPackagesToRename = exports.JniLibNames = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Directories_1 = require("../../Directories");
exports.JniLibNames = [
    'libfb',
    'libfbjni',
    'libfolly_json',
    'libglog_init',
    'glog',
    'reactnativejni',
    'reactnativejnifb',
    'csslayout',
    'yoga',
    'fbgloginit',
    'yogajni',
    'jschelpers',
    'packagerconnectionjnifb',
    'privatedata',
    'yogafastmath',
    'fabricjscjni',
    'jscexecutor',
    'libjscexecutor',
    'jsinspector',
    'libjsinspector',
    'fabricjni',
    'turbomodulejsijni',
    'reactnativeblob',
    'jsijniprofiler',
    'hermes',
    'hermes-executor-release',
    'hermes-executor-debug',
    'reanimated',
];
// this list is used in the shell scripts as well as directly by expotools
// we read it in here to keep the source of truth in one place
exports.getJavaPackagesToRename = async () => {
    const packagesToRename = await fs_extra_1.default.readFile(path_1.default.join(Directories_1.getExpotoolsDir(), 'src/versioning/android/android-packages-to-rename.txt'), 'utf8');
    return packagesToRename.split('\n').filter((p) => !!p);
};
//# sourceMappingURL=libraries.js.map