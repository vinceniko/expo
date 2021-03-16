"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKUPABLE_OPTIONS_FIELDS = exports.BACKUP_EXPIRATION_TIME = exports.BACKUP_PATH = exports.BACKUP_FILE_NAME = void 0;
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
/**
 * File name of the backup file.
 */
exports.BACKUP_FILE_NAME = 'publish-packages.backup.json';
/**
 * Absolute path to the backup file.
 */
exports.BACKUP_PATH = path_1.default.join(Constants_1.EXPOTOOLS_DIR, 'cache', exports.BACKUP_FILE_NAME);
/**
 * Time in milliseconds after which the backup is treated as no longer valid.
 */
exports.BACKUP_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
/**
 * An array of option names that are stored in the backup and
 * are required to stay the same to use the backup at next call.
 */
exports.BACKUPABLE_OPTIONS_FIELDS = [
    'packageNames',
    'prerelease',
    'tag',
    'commitMessage',
    'dry',
];
//# sourceMappingURL=constants.js.map