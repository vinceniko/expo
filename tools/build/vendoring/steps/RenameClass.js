"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameClass = void 0;
const TransformFilesContent_1 = require("./TransformFilesContent");
const TransformFilesName_1 = require("./TransformFilesName");
function renameClass({ filePattern, className, newClassName, }) {
    return [
        new TransformFilesName_1.TransformFilesName({
            filePattern,
            find: className,
            replace: newClassName,
        }),
        new TransformFilesContent_1.TransformFilesContent({
            filePattern,
            find: className,
            replace: newClassName,
        }),
    ];
}
exports.renameClass = renameClass;
//# sourceMappingURL=RenameClass.js.map