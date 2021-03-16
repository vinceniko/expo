"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("../Constants");
const ProjectVersions_1 = require("../ProjectVersions");
const Utils_1 = require("../Utils");
class AndroidClientBuilder {
    constructor() {
        this.platform = 'android';
    }
    getAppPath() {
        return path_1.default.join(Constants_1.ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    }
    getClientUrl(appVersion) {
        return `https://d1ahtucjixef4r.cloudfront.net/Exponent-${appVersion}.apk`;
    }
    async getAppVersionAsync() {
        return ProjectVersions_1.androidAppVersionAsync();
    }
    async buildAsync() {
        await Utils_1.spawnAsync('fastlane', ['android', 'build', 'build_type:Release'], { stdio: 'inherit' });
    }
    async uploadBuildAsync(s3Client, appVersion) {
        const file = fs_extra_1.default.createReadStream(this.getAppPath());
        await s3Client
            .putObject({
            Bucket: 'exp-android-apks',
            Key: `Exponent-${appVersion}.apk`,
            Body: file,
            ACL: 'public-read',
        })
            .promise();
    }
}
exports.default = AndroidClientBuilder;
//# sourceMappingURL=AndroidClientBuilder.js.map