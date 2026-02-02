import chalk from "chalk";
import fs from 'fs';
import minimist from 'minimist';
import { cmdHelp } from './commands/help';
import { cmdListExamples } from './commands/listExamples';
import { handleExampleCommand } from './example/createFromExample';
import { exampleCache } from './example/ExampleCache';
import { refreshRegistry } from './example/ExampleRegistry';
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
            v: 'version',
            e: 'example'
        },
        string: ['example', 'preset'],
        boolean: ['list-examples', 'refresh-registry', 'from-example', 'no-example', 'clear-cache']
    });

    if (args.version) {
        console.log(VERSION);
        return;
    }

    if (args.help) {
        cmdHelp();
        return;
    }

    // List all available examples
    if (args['list-examples']) {
        await cmdListExamples();
        return;
    }

    // Force refresh registry cache
    if (args['refresh-registry']) {
        console.log(i18n.example.refreshingRegistry);
        await refreshRegistry();
        console.log(i18n.example.registryRefreshed);
        return;
    }

    // Clear all cache
    if (args['clear-cache']) {
        console.log(i18n.example.clearingCache);
        await exampleCache.clearAll();
        console.log(i18n.example.cacheCleared);
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

    // Handle --example flag: create from example
    if (args.example) {
        if (!projectDir) {
            throw new Error(i18n.inputProjectDir);
        }
        await handleExampleCommand(projectDir, args.example);
        return;
    }

    // Check Preset
    let initOptions: Partial<CreateOptions> & { fromExample?: boolean; noExample?: boolean } = {
        projectDir: projectDir
    };

    // Handle --from-example / --no-example flags
    if (args['from-example']) {
        initOptions.fromExample = true;
    }
    if (args['no-example']) {
        initOptions.noExample = true;
    }

    if (args.preset) {
        let presetOptions = preset[args.preset];
        if (!presetOptions) {
            throw new Error(i18n.presetNotExist(args.preset))
        }
        initOptions = {
            ...presetOptions,
            ...initOptions,
            noExample: true // Preset mode skips example selection
        }
    }

    // Get Full Options
    let createOptions: CreateOptions = await inputCreateOptions(initOptions);

    // Check if user selected an example in interactive mode
    if ((createOptions as any).__fromExample) {
        // Project was already created from example, exit
        return;
    }

    await createApp(createOptions);
};

function exitWithError(e: Error) {
    done(false);
    console.error(i18n.flagError, chalk.red(e.message));
    process.exit(-1);
}