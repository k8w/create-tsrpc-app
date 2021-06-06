import 'colors';
import fs from 'fs';
import minimist from 'minimist';
import { cmdHelp } from './commands/help';
import { i18n } from './i18n/i18n';
import { createApp } from './models/createApp';
import { CreateOptions } from './models/CreateOptions';
import { inputCreateOptions } from './models/inputCreateOptions';
import { presets } from './models/presets';
import { VERSION } from './models/version';

main().then(() => {
    process.exit(0);
}).catch(e => {
    exitWithError(e);
});

process.on('unhandledRejection', (e: Error) => {
    exitWithError(e);
});

async function main() {
    const args = minimist(process.argv.slice(2), {
        alias: {
            p: 'presets',
            h: 'help',
            v: 'version'
        }
    });

    if (args.version) {
        console.log(VERSION);
        return;
    }

    if (args.help) {
        cmdHelp();
        return;
    }

    // Check project-dir
    let projectDir = args._[0];
    if (!projectDir) {
        // 如果当前文件夹是空文件夹，则自动设置为 '.'
        if (fs.readdirSync('.').length === 0) {
            projectDir = '.';
        }
    }

    // Check Presets
    let initOptions: Partial<CreateOptions> = {
        projectDir: projectDir
    };
    if (args.presets) {
        let presetsOptions = presets[args.presets];
        if (!presetsOptions) {
            throw new Error(i18n.presetsNotExist(args.presets))
        }
        initOptions = {
            ...presetsOptions,
            ...initOptions
        }
    }

    // Get Full Options
    let createOptions: CreateOptions = await inputCreateOptions(initOptions);

    await createApp(createOptions);
};

function exitWithError(e: Error) {
    console.error(i18n.flagError, e.message.red);
    process.exit(-1);
}