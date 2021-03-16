"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableProjectTemplatesAsync = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
async function getAvailableProjectTemplatesAsync() {
    const templates = await fs_extra_1.default.readdir(Constants_1.TEMPLATES_DIR);
    return Promise.all(templates.map(async (template) => {
        const packageJson = await json_file_1.default.readAsync(path_1.default.join(Constants_1.TEMPLATES_DIR, template, 'package.json'));
        return {
            name: packageJson.name,
            version: packageJson.version,
            path: path_1.default.join(Constants_1.TEMPLATES_DIR, template),
        };
    }));
}
exports.getAvailableProjectTemplatesAsync = getAvailableProjectTemplatesAsync;
//# sourceMappingURL=ProjectTemplates.js.map