"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentOnIssueAsync = exports.getClosedIssuesAsync = exports.getPullRequestAsync = exports.dispatchWorkflowEventAsync = exports.getJobsForWorkflowRunAsync = exports.getLatestDispatchedWorkflowRunAsync = exports.getWorkflowRunsAsync = exports.getWorkflowsAsync = void 0;
const request_1 = require("@octokit/request");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Utils_1 = require("./Utils");
const Constants_1 = require("./Constants");
/**
 * Requests for the list of active workflows.
 */
async function getWorkflowsAsync() {
    const response = await request_1.request('GET /repos/:owner/:repo/actions/workflows', makeExpoOptions({}));
    // We need to filter out some workflows because they might have
    // - empty `name` or `path` (why?)
    // - inactive state
    // - workflow config no longer exists
    const workflows = await Utils_1.filterAsync(response.data.workflows, async (workflow) => Boolean(workflow.name &&
        workflow.path &&
        workflow.state === 'active' &&
        (await fs_extra_1.default.pathExists(path_1.default.join(Constants_1.EXPO_DIR, workflow.path)))));
    return workflows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((workflow) => {
        const slug = path_1.default.basename(workflow.path, path_1.default.extname(workflow.path));
        return {
            ...workflow,
            slug,
            baseSlug: slug,
        };
    });
}
exports.getWorkflowsAsync = getWorkflowsAsync;
/**
 * Requests for the list of manually triggered runs for given workflow ID.
 */
async function getWorkflowRunsAsync(workflowId, event) {
    const response = await request_1.request('GET /repos/:owner/:repo/actions/runs', makeExpoOptions({ event }));
    return response.data.workflow_runs.filter((workflowRun) => workflowRun.workflow_id === workflowId);
}
exports.getWorkflowRunsAsync = getWorkflowRunsAsync;
/**
 * Resolves to the recently dispatched workflow run.
 */
async function getLatestDispatchedWorkflowRunAsync(workflowId) {
    var _a;
    const workflowRuns = await getWorkflowRunsAsync(workflowId, 'workflow_dispatch');
    return (_a = workflowRuns[0]) !== null && _a !== void 0 ? _a : null;
}
exports.getLatestDispatchedWorkflowRunAsync = getLatestDispatchedWorkflowRunAsync;
/**
 * Requests for the list of job for workflow run with given ID.
 */
async function getJobsForWorkflowRunAsync(workflowRunId) {
    const response = await request_1.request('GET /repos/:owner/:repo/actions/runs/:run_id/jobs', makeExpoOptions({
        run_id: workflowRunId,
    }));
    return response.data.jobs;
}
exports.getJobsForWorkflowRunAsync = getJobsForWorkflowRunAsync;
/**
 * Dispatches an event that triggers a workflow with given ID or workflow filename (including extension).
 */
async function dispatchWorkflowEventAsync(workflowId, ref, inputs) {
    await request_1.request('POST /repos/:owner/:repo/actions/workflows/:workflow_id/dispatches', 
    // @ts-ignore It expects workflow_id to be a number, however workflow filename (string) is also supported.
    makeExpoOptions({
        workflow_id: workflowId,
        ref,
        inputs: inputs !== null && inputs !== void 0 ? inputs : {},
    }));
}
exports.dispatchWorkflowEventAsync = dispatchWorkflowEventAsync;
/**
 * Requests for the pull request object.
 */
async function getPullRequestAsync(pullRequestId) {
    const response = await request_1.request('GET /repos/:owner/:repo/pulls/:pull_number', makeExpoOptions({
        pull_number: pullRequestId,
    }));
    return response.data;
}
exports.getPullRequestAsync = getPullRequestAsync;
/**
 * Returns an array of issue IDs that has been auto-closed by the pull request.
 */
async function getClosedIssuesAsync(pullRequestId) {
    const pullRequest = await getPullRequestAsync(pullRequestId);
    const matches = Utils_1.execAll(/(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved) (#|https:\/\/github\.com\/expo\/expo\/issues\/)(\d+)/gi, pullRequest.body, 2);
    return matches.map((match) => parseInt(match, 10)).filter((issue) => !isNaN(issue));
}
exports.getClosedIssuesAsync = getClosedIssuesAsync;
/**
 * Creates an issue comment with given body.
 */
async function commentOnIssueAsync(issueId, body) {
    const response = await request_1.request('POST /repos/:owner/:repo/issues/:issue_number/comments', makeExpoOptions({
        issue_number: issueId,
        body,
    }));
    return response.data;
}
exports.commentOnIssueAsync = commentOnIssueAsync;
/**
 * Copies given object with params specific for `expo/expo` repository and with authorization token.
 */
function makeExpoOptions(options) {
    return {
        headers: {
            authorization: `token ${process.env.GITHUB_TOKEN}`,
            ...options === null || options === void 0 ? void 0 : options.headers,
        },
        owner: 'expo',
        repo: 'expo',
        ...options,
    };
}
//# sourceMappingURL=GitHubActions.js.map