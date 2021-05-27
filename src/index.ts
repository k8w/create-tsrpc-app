import 'colors';
import fs from 'fs';
import minimist from 'minimist';
import { createApp } from './models/createApp';
import { CreateOptions } from './models/CreateOptions';
import { inputCreateOptions } from './models/inputCreateOptions';
import { presets } from './models/presets';

main().catch(e => {
    exitWithError(e);
});

process.on('unhandledRejection', (e: Error) => {
    exitWithError(e);
});

async function main() {
    const args = minimist(process.argv.slice(2), {
        alias: {
            p: 'presets'
        }
    });

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
            throw new Error(`Presets 不存在：${args.presets.yellow}`)
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
    console.error(' ERROR '.bgRed.white, e.message.red);
    process.exit(-1);
}