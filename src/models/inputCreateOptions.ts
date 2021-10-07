import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { i18n } from "../i18n/i18n";
import { CreateOptions } from "./CreateOptions";
import { VERSION } from "./version";

export async function inputCreateOptions(options: Partial<CreateOptions>): Promise<CreateOptions> {
    console.clear();
    console.log(i18n.welcome(VERSION));

    let projectDir = options.projectDir;
    if (projectDir) {
        console.log(i18n.createApp(path.basename(path.resolve(projectDir))));
    }
    // 请输入要创建的项目目录名
    else {
        projectDir = (await inquirer.prompt([{
            type: 'input',
            name: 'projectDir',
            message: i18n.inputProjectDir,
            validate: v => !!v
        }], { projectDir: projectDir })).projectDir as string;
    }

    // 目标文件夹不为空，要以覆盖模式继续吗？
    let dir = fs.existsSync(projectDir) && fs.statSync(projectDir).isDirectory() && fs.readdirSync(projectDir);
    if (dir && dir.filter(v=>!v.startsWith('.')).length) {
        console.log(chalk.cyan(`\n${path.resolve(projectDir)}\n${dir.map(v => chalk.yellow('  |- ' + v)).join('\n')}\n`));
        if (!(await inquirer.prompt({
            type: 'confirm',
            message: i18n.dirNotEmpty,
            name: 'res',
            default: false
        })).res) {
            console.log(i18n.canceled);
            process.exit();
        }
    }

    // client
    // 请选择要创建的项目类型
    let client = await select(i18n.selectProjectType, [
        new inquirer.Separator('\n' + i18n.projectCategory.browser + '\n'),
        { name: i18n.projectType.react, value: 'react' },
        { name: i18n.projectType.vue2, value: 'vue2' },
        { name: i18n.projectType.vue3, value: 'vue3' },
        { name: i18n.projectType.nativeBrowser, value: 'browser' },

        new inquirer.Separator('\n' + i18n.projectCategory.server + '\n'),
        { name: i18n.projectType.server, value: 'none' }
    ] as any, options.client);

    // server
    let server = await select(i18n.selectServerType, [
        { name: i18n.httpShortService, value: 'http' },
        { name: i18n.wsLongService, value: 'ws' }
    ], options.server);

    // features
    // let features: CreateOptions['features'] = options.features || [];
    // if (serverFeatures.length || clientFeatures.length) {
    //     let platformClientFeatures = clientFeatures.filter(v => v.platforms.indexOf(client) > -1);
    //     let featureChoices = platformClientFeatures.length ? [
    //         // new inquirer.Separator(` ===== ${i18n.server} ===== `),
    //         ...serverFeatures,
    //         // new inquirer.Separator(` ===== ${clientName} ===== `),
    //         ...platformClientFeatures
    //     ] : serverFeatures;
    //     features = (await inquirer.prompt([{
    //         type: 'checkbox',
    //         message: i18n.selectFeatures,
    //         name: 'features',
    //         choices: featureChoices,
    //         pageSize: 20
    //     }], { features: options.features })).features as CreateOptions['features'];
    //     if (!features.length && !options.features && !(await inquirer.prompt({
    //         type: 'confirm',
    //         name: 'res',
    //         message: i18n['confirm?'],
    //         default: true
    //     })).res) {
    //         console.log(i18n.canceled);
    //         process.exit(-1);
    //     }
    // }

    return {
        projectDir: projectDir,
        server: server,
        client: client,
        features: ['symlink', 'unitTest']
    };
}

export function getProjectName(projectDir: string) {
    return path.basename(path.resolve(projectDir));
}

export async function select<T extends string>(msg: string, options: { name: string, value: T }[], answer?: T): Promise<T> {
    let res = await inquirer.prompt({
        type: 'list',
        name: 'res',
        message: msg,
        choices: options,
        pageSize: 12
    }, { res: answer });
    return res.res;
}