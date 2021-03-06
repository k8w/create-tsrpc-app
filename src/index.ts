import chalk from "chalk";
import fs from 'fs';
import minimist from 'minimist';
import { cmdHelp } from './commands/help';
import { i18n } from './i18n/i18n';
import { createApp, done } from './models/createApp';
import { CreateOptions } from './models/CreateOptions';
import { ensureSymlinks } from "./models/ensureSymlinks";
import { inputCreateOptions } from './models/inputCreateOptions';
import { preset } from './models/preset';
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
            p: 'preset',
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

    if (args['link-elevate']) {
        let confs = JSON.parse(decodeURIComponent(args['link-elevate']))
        await ensureSymlinks(confs, true);
        return;
    }

    // Check project-dir
    let projectDir = args._[0];
    if (!projectDir) {
        // 如果当前文件夹是空文件夹，则自动设置为 '.'
        if (fs.readdirSync('.').filter(v => !v.startsWith('.')).length === 0) {
            projectDir = '.';
        }
    }

    // Check Preset
    let initOptions: Partial<CreateOptions> = {
        projectDir: projectDir
    };
    if (args.preset) {
        let presetOptions = preset[args.preset];
        if (!presetOptions) {
            throw new Error(i18n.presetNotExist(args.preset))
        }
        initOptions = {
            ...presetOptions,
            ...initOptions
        }
    }

    // Get Full Options
    let createOptions: CreateOptions = await inputCreateOptions(initOptions);

    await createApp(createOptions);
};

function exitWithError(e: Error) {
    done(false);
    console.error(i18n.flagError, chalk.red(e.message));
    process.exit(-1);
}