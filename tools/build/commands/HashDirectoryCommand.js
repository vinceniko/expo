"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expotools_1 = require("../expotools");
async function action(options) {
    let hash;
    if (options.withVersions) {
        hash = await expotools_1.HashDirectory.hashDirectoryWithVersionsAsync(process.cwd());
    }
    else {
        hash = await expotools_1.HashDirectory.hashDirectoryAsync(process.cwd());
    }
    console.log(hash);
}
exports.default = (program) => {
    program
        .command('hash-directory')
        .option('--with-versions', 'Hash the directory and include versions of Yarn and Node in the input.')
        .description('Returns a hash of the current directory')
        .asyncAction(action);
};
//# sourceMappingURL=HashDirectoryCommand.js.map