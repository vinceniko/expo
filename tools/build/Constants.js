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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSIONED_RN_IOS_DIR = exports.PACKAGES_DIR = exports.TEMPLATES_DIR = exports.ANDROID_DIR = exports.IOS_DIR = exports.EXPOTOOLS_DIR = exports.EXPO_DIR = exports.PRODUCTION_API_HOST = exports.STAGING_API_HOST = void 0;
const Directories = __importStar(require("./Directories"));
exports.STAGING_API_HOST = 'staging.exp.host';
exports.PRODUCTION_API_HOST = 'exp.host';
exports.EXPO_DIR = Directories.getExpoRepositoryRootDir();
exports.EXPOTOOLS_DIR = Directories.getExpotoolsDir();
exports.IOS_DIR = Directories.getIosDir();
exports.ANDROID_DIR = Directories.getAndroidDir();
exports.TEMPLATES_DIR = Directories.getTemplatesDir();
exports.PACKAGES_DIR = Directories.getPackagesDir();
exports.VERSIONED_RN_IOS_DIR = Directories.getVersionedReactNativeIosDir();
//# sourceMappingURL=Constants.js.map