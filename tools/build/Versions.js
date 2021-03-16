"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifySdkVersionsAsync = exports.setVersionsAsync = exports.getSdkVersionsAsync = exports.getVersionsAsync = exports.VersionsApiHost = void 0;
const xdl_1 = require("@expo/xdl");
var VersionsApiHost;
(function (VersionsApiHost) {
    VersionsApiHost["PRODUCTION"] = "exp.host";
    VersionsApiHost["STAGING"] = "staging.exp.host";
})(VersionsApiHost = exports.VersionsApiHost || (exports.VersionsApiHost = {}));
async function getVersionsAsync(apiHost = VersionsApiHost.STAGING) {
    return await runWithApiHost(apiHost, () => xdl_1.Versions.versionsAsync());
}
exports.getVersionsAsync = getVersionsAsync;
async function getSdkVersionsAsync(sdkVersion, apiHost = VersionsApiHost.STAGING) {
    var _a, _b;
    const versions = await getVersionsAsync(apiHost);
    return (_b = (_a = versions === null || versions === void 0 ? void 0 : versions.sdkVersions) === null || _a === void 0 ? void 0 : _a[sdkVersion]) !== null && _b !== void 0 ? _b : null;
}
exports.getSdkVersionsAsync = getSdkVersionsAsync;
async function setVersionsAsync(versions, apiHost = VersionsApiHost.STAGING) {
    return await runWithApiHost(apiHost, () => xdl_1.Versions.setVersionsAsync(versions));
}
exports.setVersionsAsync = setVersionsAsync;
async function modifySdkVersionsAsync(sdkVersion, modifier) {
    var _a;
    const versions = await getVersionsAsync();
    const sdkVersions = await modifier((_a = versions.sdkVersions[sdkVersion]) !== null && _a !== void 0 ? _a : {});
    versions.sdkVersions[sdkVersion] = sdkVersions;
    await setVersionsAsync(versions);
    return sdkVersions;
}
exports.modifySdkVersionsAsync = modifySdkVersionsAsync;
async function runWithApiHost(apiHost, lambda) {
    const originalHost = xdl_1.Config.api.host;
    xdl_1.Config.api.host = apiHost;
    const result = await lambda();
    xdl_1.Config.api.host = originalHost;
    return result;
}
//# sourceMappingURL=Versions.js.map