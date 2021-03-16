"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDirectoriesAsync = exports._s3ClientAsync = exports.downloadFromRedirectAsync = exports.downloadAsync = exports.uploadAsync = exports.getCachedArtifactAsync = exports.getURI = exports.addRedirectAsync = exports.S3_WEBSITE_PATH = exports.S3_URL = exports.S3_BUCKET = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
exports.S3_BUCKET = 'exp-artifacts';
exports.S3_URL = `s3://${exports.S3_BUCKET}`;
exports.S3_WEBSITE_PATH = `build-artifacts.exp.host`;
const fsWriteFileAsync = util_1.promisify(fs_extra_1.default.writeFile);
async function addRedirectAsync(from, to) {
    from = from.replace(new RegExp(`^s3:\/\/${exports.S3_BUCKET}\/?`), '');
    let s3 = await _s3ClientAsync();
    await s3
        .putObject({
        Bucket: exports.S3_BUCKET,
        CacheControl: 'no-cache',
        Key: `${to}`,
        Body: '',
        ACL: 'public-read',
        WebsiteRedirectLocation: `/${from.replace(/^\//, '')}`,
    })
        .promise();
}
exports.addRedirectAsync = addRedirectAsync;
function getURI(path) {
    return `http://${exports.S3_WEBSITE_PATH}/${path.replace(/^\//, '')}`;
}
exports.getURI = getURI;
async function getCachedArtifactAsync(key, destFile, createArtifactAsync, options = {}) {
    try {
        await downloadAsync(key, destFile, options);
    }
    catch (e) {
        await createArtifactAsync();
    }
}
exports.getCachedArtifactAsync = getCachedArtifactAsync;
async function uploadAsync(sourceFile, key, options = {}) {
    let file = fs_extra_1.default.createReadStream(sourceFile);
    let s3 = await _s3ClientAsync();
    await s3
        .putObject({
        Bucket: exports.S3_BUCKET,
        Key: key,
        Body: file,
        ACL: 'public-read',
        ...options,
    })
        .promise();
    return `https://s3.amazonaws.com/${options.Bucket || exports.S3_BUCKET}/${key}`;
}
exports.uploadAsync = uploadAsync;
async function downloadAsync(key, destFile, options = {}) {
    let s3 = await _s3ClientAsync();
    return new Promise((resolve, reject) => {
        const file = fs_extra_1.default.createWriteStream(destFile);
        const reader = s3
            .getObject({
            Bucket: exports.S3_BUCKET,
            Key: key,
            ...options,
        })
            .createReadStream();
        file
            .on('error', (e) => {
            reject(e);
        })
            .on('close', () => {
            resolve();
        });
        reader
            .on('error', (e) => {
            reject(e);
        })
            .pipe(file);
    });
}
exports.downloadAsync = downloadAsync;
async function downloadFromRedirectAsync(s3Path, dest) {
    let s3 = await _s3ClientAsync();
    const { WebsiteRedirectLocation: redirect } = await s3
        .headObject({
        Bucket: exports.S3_BUCKET,
        Key: s3Path,
    })
        .promise();
    if (redirect) {
        s3Path = redirect.replace(/^\//, '');
    }
    return new Promise((resolve, reject) => {
        let reader = s3
            .getObject({
            Bucket: exports.S3_BUCKET,
            Key: s3Path,
        })
            .createReadStream();
        let file = fs_extra_1.default.createWriteStream(dest);
        file
            .on('error', (e) => {
            reject(e);
        })
            .on('close', () => {
            resolve();
        });
        reader
            .on('error', (e) => {
            reject(e);
        })
            .pipe(file);
    });
}
exports.downloadFromRedirectAsync = downloadFromRedirectAsync;
async function _s3ClientAsync() {
    if (process.env.CI_S3_ACCESS_KEY_ID &&
        process.env.CI_S3_SECRET_ACCESS_KEY &&
        process.env.CI_S3_DEFAULT_REGION) {
        aws_sdk_1.default.config.update({
            accessKeyId: process.env.CI_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.CI_S3_SECRET_ACCESS_KEY,
            region: process.env.CI_S3_DEFAULT_REGION,
        });
    }
    else {
        console.log('Defaulting to AWS credentials on developer machine.');
    }
    return new aws_sdk_1.default.S3({ region: 'us-east-1' });
}
exports._s3ClientAsync = _s3ClientAsync;
/*
 * `directories` is an array of objects that look like:
 * {
 *   source: absolute path to a directory,
 *   destination: relative path in the resulting tarball,
 * }
 * These will all be zipped up and uploaded to the specified bucket.
 */
async function uploadDirectoriesAsync(bucket, key, directories) {
    let dirname = await fs_extra_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), '-pt-upload'));
    const tmpDir = path_1.default.join(dirname, 'upload-directories-tmp');
    const tmpTarGz = path_1.default.join(dirname, 'upload-directories-tmp-targz.tar.gz');
    let spawnOptions = {
        stdio: 'inherit',
        cwd: dirname,
    };
    await spawn_async_1.default('mkdir', ['-p', tmpDir], spawnOptions);
    const excludeFile = path_1.default.join(dirname, 'excludeFile.txt');
    for (let directory of directories) {
        if (directory.isFile) {
            await spawn_async_1.default('cp', [directory.source, path_1.default.join(tmpDir, directory.destination)], spawnOptions);
        }
        else {
            await spawn_async_1.default('mkdir', ['-p', path_1.default.join(tmpDir, directory.destination)], spawnOptions);
            // Exclude files that are not tracked in git
            let gitCommand = await spawn_async_1.default('git', ['-C', '.', 'ls-files', '--exclude-standard', '-oi', '--directory'], {
                cwd: directory.source,
            });
            let gitCommandOutput = gitCommand.stdout.toString();
            await fsWriteFileAsync(excludeFile, gitCommandOutput);
            await spawn_async_1.default('rsync', [
                '-azP',
                '--exclude=.git',
                `--exclude-from=${excludeFile}`,
                '.',
                path_1.default.join(tmpDir, directory.destination),
            ], {
                stdio: 'inherit',
                cwd: directory.source,
            });
        }
    }
    await spawn_async_1.default('tar', ['-zcvf', tmpTarGz, '-C', tmpDir, '--exclude', '__internal__', '.'], spawnOptions);
    let s3 = await _s3ClientAsync();
    let file = fs_extra_1.default.createReadStream(tmpTarGz);
    await s3
        .putObject({
        Bucket: bucket,
        Key: key,
        Body: file,
        ACL: 'public-read',
    })
        .promise();
    await spawn_async_1.default('rm', [tmpTarGz], spawnOptions);
    await spawn_async_1.default('rm', ['-rf', tmpDir], spawnOptions);
}
exports.uploadDirectoriesAsync = uploadDirectoriesAsync;
//# sourceMappingURL=S3.js.map