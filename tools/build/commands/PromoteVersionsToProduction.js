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
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const xdl_1 = require("@expo/xdl");
const jsondiffpatch = __importStar(require("jsondiffpatch"));
const Constants_1 = require("../Constants");
async function action() {
    // Get from staging
    xdl_1.Config.api.host = Constants_1.STAGING_API_HOST;
    const versionsStaging = await xdl_1.Versions.versionsAsync();
    // since there is only one versions cache, we need to wait a small
    // amount of time so that the cache is invalidated before fetching from prod
    await new Promise((resolve) => setTimeout(resolve, 10));
    xdl_1.Config.api.host = Constants_1.PRODUCTION_API_HOST;
    const versionsProd = await xdl_1.Versions.versionsAsync();
    const delta = jsondiffpatch.diff(versionsProd, versionsStaging);
    if (!delta) {
        console.log(chalk_1.default.yellow('There are no changes to apply in the configuration.'));
        return;
    }
    console.log(`Here is the diff from ${chalk_1.default.green('staging')} -> ${chalk_1.default.green('production')}:`);
    console.log(jsondiffpatch.formatters.console.format(delta, versionsProd));
    const { isCorrect } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'isCorrect',
            message: `Does this look correct? Type \`y\` to update ${chalk_1.default.green('production')} config.`,
            default: false,
        },
    ]);
    if (isCorrect) {
        // Promote staging configuration to production.
        await xdl_1.Versions.setVersionsAsync(versionsStaging);
        console.log(chalk_1.default.green('\nSuccessfully updated production config. You can check it out on'), chalk_1.default.blue(`https://${Constants_1.PRODUCTION_API_HOST}/--/api/v2/versions`));
    }
    else {
        console.log(chalk_1.default.yellow('Canceled'));
    }
}
exports.default = (program) => {
    program
        .command('promote-versions-to-production')
        .alias('promote-versions-to-prod', 'promote-versions')
        .description('Promotes the latest versions config from staging to production.')
        .asyncAction(action);
};
//# sourceMappingURL=PromoteVersionsToProduction.js.map