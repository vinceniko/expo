"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const CocoaPods_1 = require("../CocoaPods");
const Constants_1 = require("../Constants");
const ProjectVersions_1 = require("../ProjectVersions");
const Utils_1 = require("../Utils");
class IosClientBuilder {
    constructor() {
        this.platform = 'ios';
    }
    getAppPath() {
        return path_1.default.join(Constants_1.IOS_DIR, 'simulator-build', 'Build', 'Products', 'Release-iphonesimulator', 'Exponent.app');
    }
    getClientUrl(appVersion) {
        return `https://dpq5q02fu5f55.cloudfront.net/Exponent-${appVersion}.tar.gz`;
    }
    async getAppVersionAsync() {
        return await ProjectVersions_1.iosAppVersionAsync();
    }
    async buildAsync() {
        await CocoaPods_1.podInstallAsync(Constants_1.IOS_DIR, {
            stdio: 'inherit',
        });
        await Utils_1.spawnAsync('fastlane', ['ios', 'create_simulator_build'], { stdio: 'inherit' });
    }
    async uploadBuildAsync(s3Client, appVersion) {
        const tempAppPath = path_1.default.join(Constants_1.EXPO_DIR, 'temp-app.tar.gz');
        await Utils_1.spawnAsync('tar', ['-zcvf', tempAppPath, '-C', this.getAppPath(), '.'], {
            stdio: ['ignore', 'ignore', 'inherit'],
        });
        const file = fs_extra_1.default.createReadStream(tempAppPath);
        await s3Client
            .putObject({
            Bucket: 'exp-ios-simulator-apps',
            Key: `Exponent-${appVersion}.tar.gz`,
            Body: file,
            ACL: 'public-read',
        })
            .promise();
        await fs_extra_1.default.remove(tempAppPath);
    }
}
exports.default = IosClientBuilder;
//# sourceMappingURL=IosClientBuilder.js.map