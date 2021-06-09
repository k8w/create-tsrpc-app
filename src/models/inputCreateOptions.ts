import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { i18n } from "../i18n/i18n";
import { clientFeatures, CreateOptions, serverFeatures } from "./CreateOptions";
import { VERSION } from "./version";

export async function inputCreateOptions(options: Partial<CreateOptions>): Promise<CreateOptions> {
    console.clear();
    console.log(`create-tsrpc-app ${i18n.version} ${VERSION}\n`.green.bold)

    let projectDir = options.projectDir;
    if (projectDir) {
        console.log(i18n.createApp(path.basename(path.resolve(projectDir))));
    }
    else {
        console.log(i18n.welcome);
        projectDir = (await inquirer.prompt([{
            type: 'input',
            name: 'projectDir',
            message: i18n.inputProjectDir,
            validate: v => !!v
        }], { projectDir: projectDir })).projectDir as string;
    }

    let dir = fs.existsSync(projectDir) && fs.statSync(projectDir).isDirectory() && fs.readdirSync(projectDir);
    if (dir && dir.length) {
        console.log(`${path.resolve(projectDir).green}\n${dir.map(v => ('  |- ' + v).yellow).join('\n')}\n`);
        throw new Error(i18n.dirNotEmpty)
    }

    // server
    let server = await select(i18n.selectServerType, [
        { name: i18n.httpShortService, value: 'http' },
        { name: i18n.wsLongService, value: 'ws' }
    ], options.server);

    let client = await select(i18n.selectClientType, [
        { name: i18n.browser, value: 'browser' },
        new inquirer.Separator((i18n.wxApp + ' (comming soon)').gray),
        new inquirer.Separator((i18n.nodeJs + ' (comming soon)').gray),
        // { name: i18n.wxApp, value: 'wxapp' },
        // { name: i18n.nodeJs, value: 'node' },
        { name: i18n.noClient, value: 'none' },
    ] as any, options.client);
    let clientName = client === 'browser' ? i18n.browser : client === 'wxapp' ? i18n.wxApp : i18n.client;

    if (client === 'browser' && !options.client) {
        client = await select(i18n.selectFrontFramework, [
            { name: i18n.ffBrowser, value: 'browser' },
            { name: i18n.ffReact, value: 'react' },
            { name: i18n.ffVue2, value: 'vue2' },
            { name: i18n.ffVue3, value: 'vue3' },
        ]);
    }

    // features
    let features: CreateOptions['features'] = options.features || [];
    if (serverFeatures.length || clientFeatures.length) {
        let platformClientFeatures = clientFeatures.filter(v => v.platforms.indexOf(client) > -1);
        let featureChoices = platformClientFeatures.length ? [
            // new inquirer.Separator(` ===== ${i18n.server} ===== `),
            ...serverFeatures,
            // new inquirer.Separator(` ===== ${clientName} ===== `),
            ...platformClientFeatures
        ] : serverFeatures;
        features = (await inquirer.prompt([{
            type: 'checkbox',
            message: i18n.selectFeatures,
            name: 'features',
            choices: featureChoices,
            pageSize: 20
        }], { features: options.features })).features as CreateOptions['features'];
        if (!features.length && !options.features && !(await inquirer.prompt({
            type: 'confirm',
            name: 'res',
            message: i18n['confirm?'],
            default: true
        })).res) {
            console.log(i18n.canceled);
            process.exit(-1);
        }
    }

    return {
        projectDir: projectDir,
        server: server,
        client: client,
        features: features
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
        choices: options
    }, { res: answer });
    return res.res;
}