import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { clientFeatures, CreateOptions, serverFeatures } from "./CreateOptions";

export async function inputCreateOptions(options: Partial<CreateOptions>): Promise<CreateOptions> {
    console.clear();

    let projectDir = options.projectDir;
    if (projectDir) {
        console.log(`创建 TSRPC 应用: ${path.basename(path.resolve(projectDir)).green}`);
    }
    else {
        projectDir = (await inquirer.prompt([{
            type: 'input',
            name: 'projectDir',
            message: '请输入项目目录名：',
            validate: v => !!v
        }], { projectDir: projectDir })).projectDir as string;
    }

    let dir = fs.existsSync(projectDir) && fs.statSync(projectDir).isDirectory() && fs.readdirSync(projectDir);
    if (dir && dir.length) {
        console.log(`${path.resolve(projectDir).green}\n${dir.map(v => ('  |- ' + v).yellow).join('\n')}\n`);
        throw new Error('目标文件夹不为空，请先清空或删除目标文件夹再创建。')
    }

    // server
    let server = await select('请选择服务端连接类型：', [
        { name: 'HTTP 短连接', value: 'http' },
        { name: 'WebSocket 长连接', value: 'ws' }
    ], options.server);

    let client = await select('请选择客户端项目类型：', [
        { name: '浏览器', value: 'browser' },
        { name: '微信小程序', value: 'wxapp' },
        { name: 'NodeJS', value: 'node' },
        { name: '不创建客户端项目', value: 'none' },
    ], options.client);

    if (client === 'browser') {
        client = await select('请选择前端使用的框架：', [
            { name: 'React', value: 'react' },
            { name: 'Vue 2.x', value: 'vue2' },
            { name: 'Vue 3.x', value: 'vue3' },
            { name: '无框架' + ' (仅含 webpack 基础配置)'.yellow, value: 'browser' },
        ]);
    }

    // features
    let features = [
        new inquirer.Separator(' = 服务端特性 = '),
        ...serverFeatures,
        new inquirer.Separator(' = 浏览器端特性 = '),
        ...clientFeatures
    ];
    await inquirer.prompt([{
        type: 'checkbox',
        message: 'sssss',
        name: 'adsg',
        choices: features,
        pageSize: 20,
    }])

    return options as any;
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