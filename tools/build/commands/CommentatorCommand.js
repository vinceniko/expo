"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const Formatter_1 = require("../Formatter");
const GitHubActions_1 = require("../GitHubActions");
const Logger_1 = __importDefault(require("../Logger"));
exports.default = (program) => {
    program
        .command('commentator')
        .alias('comment')
        .option('-p, --payload <payload>', 'Serialized and escaped JSON array describing what and where to comment.')
        .description(`To add "Hello!" comment on issue #1234, run it with ${chalk_1.default.blue.italic(`--payload "[{\\"issue\\": 1234, \\"body\\": \\"Hello!\\"}]"`)}`)
        .asyncAction(main);
};
async function main(options) {
    const payload = parsePayload(options.payload);
    const commentedIssues = [];
    if (!Array.isArray(payload)) {
        throw new Error(`Payload must be an array.`);
    }
    for (const comment of payload) {
        if (!comment.issue || !comment.body) {
            Logger_1.default.error('Comment payload is incomplete:', comment);
            continue;
        }
        try {
            await GitHubActions_1.commentOnIssueAsync(comment.issue, comment.body);
            commentedIssues.push(comment.issue);
        }
        catch (e) {
            Logger_1.default.error(`Failed to comment on issue #${comment.issue}:`, e);
        }
    }
    if (commentedIssues.length > 0) {
        Logger_1.default.log('✍️  Commented on the following issues: %s', commentedIssues
            .map((issue) => Formatter_1.link(chalk_1.default.blue('#' + issue), `https://github.com/expo/expo/issues/${issue}`))
            .join(', '));
    }
    else {
        Logger_1.default.log('✍️  Nothing to comment.');
    }
}
function parsePayload(payloadString) {
    const payload = JSON.parse(payloadString);
    return payload;
}
//# sourceMappingURL=CommentatorCommand.js.map