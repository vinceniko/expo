"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransformPipelineAsync = void 0;
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const Constants_1 = require("../../../Constants");
async function runTransformPipelineAsync({ pipeline, targetPath, input }) {
    let output = input;
    const matches = [];
    if (!Array.isArray(pipeline.transforms)) {
        throw new Error("Pipeline's transformations must be an array of transformation patterns.");
    }
    pipeline.transforms
        .filter((transform) => pathMatchesTransformPaths(targetPath, transform.paths))
        .forEach((transform) => {
        output = output.replace(transform.replace, (match, ...args) => {
            const { leftContext } = RegExp;
            const result = transform.with.replace(/\$[1-9]/g, (m) => args[parseInt(m[1], 10) - 1]);
            matches.push({
                value: match,
                line: leftContext.split(/\n/g).length,
                replacedWith: result,
            });
            return result;
        });
    });
    if (matches.length > 0) {
        if (pipeline.logHeader) {
            pipeline.logHeader(path_1.default.relative(Constants_1.VERSIONED_RN_IOS_DIR, targetPath));
        }
        for (const match of matches) {
            console.log(`${chalk_1.default.gray(String(match.line))}:`, chalk_1.default.red('-'), chalk_1.default.red(match.value.trimRight()));
            console.log(`${chalk_1.default.gray(String(match.line))}:`, chalk_1.default.green('+'), chalk_1.default.green(match.replacedWith.trimRight()));
        }
        console.log();
    }
    return output;
}
exports.runTransformPipelineAsync = runTransformPipelineAsync;
function pathMatchesTransformPaths(filePath, transformPaths) {
    if (typeof transformPaths === 'string') {
        return filePath.includes(transformPaths);
    }
    if (Array.isArray(transformPaths)) {
        return transformPaths.some((transformPath) => filePath.includes(transformPath));
    }
    return true;
}
//# sourceMappingURL=index.js.map