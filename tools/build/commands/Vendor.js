"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const devmenu_1 = require("../vendoring/devmenu");
const CONFIGURATIONS = {
    '[dev-menu] reanimated': getReanimatedPipe(),
    '[dev-menu] gesture-handler': getGestureHandlerPipe(),
};
function getReanimatedPipe() {
    const destination = 'packages/expo-dev-menu/vendored/react-native-reanimated';
    // prettier-ignore
    return new devmenu_1.Pipe().addSteps('all', new devmenu_1.Clone({
        url: 'git@github.com:software-mansion/react-native-reanimated.git',
        tag: '1.13.0',
    }), new devmenu_1.RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
    }), new devmenu_1.CopyFiles({
        filePattern: ['src/**/*.*', '*.d.ts'],
        to: destination,
    }), 'android', devmenu_1.prefixPackage({
        packageName: 'com.swmansion.reanimated',
        prefix: 'devmenu',
    }), devmenu_1.renameClass({
        filePattern: 'android/**/*.@(java|kt)',
        className: 'UIManagerReanimatedHelper',
        newClassName: 'DevMenuUIManagerReanimatedHelper'
    }), new devmenu_1.CopyFiles({
        subDirectory: 'android/src/main/java/com/swmansion',
        filePattern: '**/*.@(java|kt|xml)',
        to: path_1.default.join(destination, 'android/devmenu/com/swmansion'),
    }), new devmenu_1.CopyFiles({
        subDirectory: 'android/src/main/java/com/facebook',
        filePattern: '**/*.@(java|kt|xml)',
        to: path_1.default.join(destination, 'android/com/facebook'),
    }), 'ios', new devmenu_1.TransformFilesName({
        filePattern: 'ios/**/*REA*.@(m|h)',
        find: 'REA',
        replace: 'DevMenuREA',
    }), devmenu_1.renameIOSSymbols({
        find: 'REA',
        replace: 'DevMenuREA',
    }), new devmenu_1.TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: 'SimAnimationDragCoefficient',
        replace: 'DevMenuSimAnimationDragCoefficient',
    }), new devmenu_1.TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
    }), new devmenu_1.CopyFiles({
        filePattern: 'ios/**/*.@(m|h)',
        to: destination,
    }));
}
function getGestureHandlerPipe() {
    const destination = 'packages/expo-dev-menu/vendored/react-native-gesture-handler';
    // prettier-ignore
    return new devmenu_1.Pipe().addSteps('all', new devmenu_1.Clone({
        url: 'git@github.com:software-mansion/react-native-gesture-handler.git',
        tag: '1.7.0',
    }), new devmenu_1.RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
    }), new devmenu_1.CopyFiles({
        filePattern: ['*.js', 'touchables/*.js', '*.d.ts'],
        to: path_1.default.join(destination, 'src'),
    }), 'android', devmenu_1.prefixPackage({
        packageName: 'com.swmansion.gesturehandler',
        prefix: 'devmenu',
    }), devmenu_1.renameClass({
        filePattern: 'android/**/*.@(java|kt)',
        className: 'RNGHModalUtils',
        newClassName: 'DevMenuRNGHModalUtils'
    }), new devmenu_1.CopyFiles({
        subDirectory: 'android/src/main/java/com/swmansion',
        filePattern: '**/*.@(java|kt|xml)',
        to: path_1.default.join(destination, 'android/devmenu/com/swmansion'),
    }), new devmenu_1.CopyFiles({
        subDirectory: 'android/lib/src/main/java',
        filePattern: '**/*.@(java|kt|xml)',
        to: path_1.default.join(destination, 'android/devmenu'),
    }), new devmenu_1.CopyFiles({
        subDirectory: 'android/src/main/java/com/facebook',
        filePattern: '**/*.@(java|kt|xml)',
        to: path_1.default.join(destination, 'android/com/facebook'),
    }), 'ios', devmenu_1.renameIOSFiles({
        find: 'RN',
        replace: 'DevMenuRN',
    }), devmenu_1.renameIOSSymbols({
        find: 'RN',
        replace: 'DevMenuRN',
    }), new devmenu_1.TransformFilesContent({
        filePattern: path_1.default.join('ios', '**', '*.@(m|h)'),
        find: '^RCT_EXPORT_MODULE\\(DevMenu(.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
    }), new devmenu_1.TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\(\\)',
        replace: '+ (NSString *)moduleName { return @"RNGestureHandlerModule"; }',
    }), new devmenu_1.TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNGestureHandlerModule.m',
        find: '@interface DevMenuRNGestureHandlerButtonManager([\\s\\S]*?)@end',
        replace: ''
    }), new devmenu_1.Append({
        filePattern: 'ios/**/DevMenuRNGestureHandlerModule.h',
        append: `@interface DevMenuRNGestureHandlerButtonManager : RCTViewManager
@end
`
    }), new devmenu_1.CopyFiles({
        filePattern: 'ios/**/*.@(m|h)',
        to: destination,
    }));
}
async function askForConfigurations() {
    const { configurationNames } = await inquirer_1.default.prompt([
        {
            type: 'checkbox',
            name: 'configurationNames',
            message: 'Which configuration would you like to run?',
            choices: Object.keys(CONFIGURATIONS),
            default: Object.keys(CONFIGURATIONS),
        },
    ]);
    return configurationNames;
}
async function action({ configuration, platform }) {
    if (!configuration.length) {
        configuration = await askForConfigurations();
    }
    const pipes = configuration.map((name) => ({ name, pipe: CONFIGURATIONS[name] }));
    const tmpdir = os_1.default.tmpdir();
    for (const { name, pipe } of pipes) {
        console.log(`Run configuration: ${chalk_1.default.green(name)}`);
        pipe.setWorkingDirectory(path_1.default.join(tmpdir, name));
        await pipe.start(platform);
        console.log();
    }
}
exports.default = (program) => {
    program
        .command('vendor')
        .alias('v')
        .description('Vendors 3rd party modules.')
        .option('-p, --platform <string>', "A platform on which the vendored module will be updated. Valid options: 'all' | 'ios' | 'android'.", 'all')
        .option('-c, --configuration [string]', 'Vendor configuration which should be run. Can be passed multiple times.', (value, previous) => previous.concat(value), [])
        .asyncAction(action);
};
//# sourceMappingURL=Vendor.js.map