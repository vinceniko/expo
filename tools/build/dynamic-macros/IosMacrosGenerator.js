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
const xdl_1 = require("@expo/xdl");
const chalk_1 = __importDefault(require("chalk"));
const plist_1 = __importDefault(require("plist"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Directories = __importStar(require("../Directories"));
const ProjectVersions = __importStar(require("../ProjectVersions"));
const EXPO_DIR = Directories.getExpoRepositoryRootDir();
async function readPlistAsync(plistPath) {
    const plistFileContent = await fs_extra_1.default.readFile(plistPath, 'utf8');
    return plist_1.default.parse(plistFileContent);
}
async function generateBuildConstantsFromMacrosAsync(buildConfigPlistPath, macros, buildConfiguration, infoPlistContents, keys) {
    const plistPath = path_1.default.dirname(buildConfigPlistPath);
    const plistName = path_1.default.basename(buildConfigPlistPath);
    if (!(await fs_extra_1.default.pathExists(buildConfigPlistPath))) {
        await xdl_1.IosPlist.createBlankAsync(plistPath, plistName);
    }
    console.log('Generating build config %s ...', chalk_1.default.cyan(path_1.default.relative(EXPO_DIR, buildConfigPlistPath)));
    const result = await xdl_1.IosPlist.modifyAsync(plistPath, plistName, (config) => {
        if (config.USE_GENERATED_DEFAULTS === false) {
            // this flag means don't generate anything, let the user override.
            return config;
        }
        for (const [name, value] of Object.entries(macros)) {
            config[name] = value || '';
        }
        config.EXPO_RUNTIME_VERSION = infoPlistContents.CFBundleVersion
            ? infoPlistContents.CFBundleVersion
            : infoPlistContents.CFBundleShortVersionString;
        if (!config.API_SERVER_ENDPOINT) {
            config.API_SERVER_ENDPOINT = 'https://exp.host/--/api/v2/';
        }
        if (keys) {
            const { AMPLITUDE_KEY, AMPLITUDE_DEV_KEY, GOOGLE_MAPS_IOS_API_KEY } = keys;
            config.DEFAULT_API_KEYS = { AMPLITUDE_KEY, AMPLITUDE_DEV_KEY, GOOGLE_MAPS_IOS_API_KEY };
        }
        return validateBuildConstants(config, buildConfiguration);
    });
    return result;
}
/**
 *  Adds IS_DEV_KERNEL (bool) and DEV_KERNEL_SOURCE (PUBLISHED, LOCAL)
 *  and errors if there's a problem with the chosen environment.
 */
function validateBuildConstants(config, buildConfiguration) {
    config.USE_GENERATED_DEFAULTS = true;
    let IS_DEV_KERNEL, DEV_KERNEL_SOURCE = '';
    if (buildConfiguration === 'Debug') {
        IS_DEV_KERNEL = true;
        DEV_KERNEL_SOURCE = config.DEV_KERNEL_SOURCE;
        if (!DEV_KERNEL_SOURCE) {
            // default to dev published build if nothing specified
            DEV_KERNEL_SOURCE = 'PUBLISHED';
        }
    }
    else {
        IS_DEV_KERNEL = false;
    }
    if (IS_DEV_KERNEL) {
        if (DEV_KERNEL_SOURCE === 'LOCAL' && !config.BUILD_MACHINE_KERNEL_MANIFEST) {
            throw new Error(`Error generating local kernel manifest.\nMake sure a local kernel is being served, or switch DEV_KERNEL_SOURCE to use PUBLISHED instead.`);
        }
        if (DEV_KERNEL_SOURCE === 'PUBLISHED' && !config.DEV_PUBLISHED_KERNEL_MANIFEST) {
            throw new Error(`Error downloading DEV published kernel manifest.\n`);
        }
    }
    config.IS_DEV_KERNEL = IS_DEV_KERNEL;
    config.DEV_KERNEL_SOURCE = DEV_KERNEL_SOURCE;
    return config;
}
async function writeTemplatesAsync(expoKitPath, templateFilesPath) {
    if (expoKitPath) {
        await renderExpoKitPodspecAsync(expoKitPath, templateFilesPath);
        await renderExpoKitPodfileAsync(expoKitPath, templateFilesPath);
    }
}
async function renderExpoKitPodspecAsync(expoKitPath, templateFilesPath) {
    const podspecPath = path_1.default.join(expoKitPath, 'ios', 'ExpoKit.podspec');
    const podspecTemplatePath = path_1.default.join(templateFilesPath, 'ios', 'ExpoKit.podspec');
    console.log('Rendering %s from template %s ...', chalk_1.default.cyan(path_1.default.relative(EXPO_DIR, podspecPath)), chalk_1.default.cyan(path_1.default.relative(EXPO_DIR, podspecTemplatePath)));
    await xdl_1.IosPodsTools.renderExpoKitPodspecAsync(podspecTemplatePath, podspecPath, {
        IOS_EXPONENT_CLIENT_VERSION: await ProjectVersions.getNewestSDKVersionAsync('ios'),
    });
}
async function renderExpoKitPodfileAsync(expoKitPath, templateFilesPath) {
    const podfilePath = path_1.default.join(expoKitPath, 'exponent-view-template', 'ios', 'Podfile');
    const podfileTemplatePath = path_1.default.join(templateFilesPath, 'ios', 'ExpoKit-Podfile');
    console.log('Rendering %s from template %s ...', chalk_1.default.cyan(path_1.default.relative(EXPO_DIR, podfilePath)), chalk_1.default.cyan(path_1.default.relative(EXPO_DIR, podfileTemplatePath)));
    await xdl_1.IosPodsTools.renderPodfileAsync(podfileTemplatePath, podfilePath, {
        TARGET_NAME: 'exponent-view-template',
        EXPOKIT_PATH: '../..',
        REACT_NATIVE_PATH: '../../react-native-lab/react-native',
        UNIVERSAL_MODULES_PATH: '../../packages',
    });
}
class IosMacrosGenerator {
    async generateAsync(options) {
        const { infoPlistPath, buildConstantsPath, macros, templateSubstitutions } = options;
        // Read Info.plist
        const infoPlist = await readPlistAsync(infoPlistPath);
        // Generate EXBuildConstants.plist
        await generateBuildConstantsFromMacrosAsync(path_1.default.resolve(buildConstantsPath), macros, options.configuration, infoPlist, templateSubstitutions);
        // // Generate Podfile and ExpoKit podspec using template files.
        await writeTemplatesAsync(options.expoKitPath, options.templateFilesPath);
    }
}
exports.default = IosMacrosGenerator;
//# sourceMappingURL=IosMacrosGenerator.js.map