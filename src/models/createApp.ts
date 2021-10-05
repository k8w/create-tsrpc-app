import chalk from "chalk";
import fs from "fs-extra";
import ncu from "npm-check-updates";
import ora from "ora";
import path from "path";
import { i18n } from "../i18n/i18n";
import { CreateOptions } from "./CreateOptions";
import { getInstallEnv, npmInstall } from "./npmInstall";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, './templates') : path.resolve(__dirname, '../../dist/templates');
let totalStep = 0;

const SCREEN_WIDTH = 40;

export async function createApp(options: CreateOptions) {
    spinner.text = '';
    spinner.color = 'yellow';

    // 计算步骤数量 后端4 前端5 NPM1
    totalStep = 5 + (options.client === 'none' ? 0 : 4);

    // 判断安装环境
    doing(i18n.checkNpmEnv);
    let installEnv = await getInstallEnv();
    done(true, `${i18n.checkNpmEnv}: `
        + chalk.cyan('Command: ')
        + chalk.yellow.bold(installEnv.pkgManager)
        + (installEnv.registry ? (chalk.cyan(', Registry: ') + chalk.yellow(installEnv.registry)) : ''));

    // 创建项目
    let server = await createServer(options, installEnv.registry);
    let client: { clientDir: string, clientDirName: string } | undefined;
    if (options.client !== 'none') {
        client = await createBrowserClient(options, installEnv.registry);

        // Sync 演示代码
        if (options.features.indexOf('symlink') > -1) {
            doing('Initialize symlink');
            let target = path.relative(path.join(client.clientDir, 'src'), path.join(server.serverDir, 'src/shared'));
            await fs.symlink(target, path.join(client.clientDir, 'src/shared'), 'junction');
        }
        else {
            doing('Sync shared directory');
            await fs.copy(path.join(server.serverDir, 'src/shared'), path.join(client.clientDir, 'src/shared'), { recursive: true })
        }
        done();
    }

    // 安装依赖
    let npmResServer = false;
    let npmResClient = !client;
    doing(i18n.npmInstall, i18n.mayLongPleaseWait);
    [npmResServer, npmResClient] = await Promise.all([
        npmInstall(installEnv.pkgManager, installEnv.args, server.serverDir),
        client ? npmInstall(installEnv.pkgManager, installEnv.args, client.clientDir) : false
    ])
    done(npmResServer && npmResClient);

    console.log(chalk.green(`\n${'='.repeat(SCREEN_WIDTH)}\n`));

    const serverEnd = server.serverDirName === 'server' ? i18n.server : i18n.backend;
    const clientEnd = client?.clientDirName === 'client' ? i18n.client : i18n.frontend;

    if (npmResServer && npmResClient) {
        console.log(i18n.createAppSucc);
    }
    else {
        console.log(i18n.createAppSuccWithProblems);
        if (!npmResServer) {
            console.log(i18n.npmInstallFailed(serverEnd, path.relative('.', server.serverDir)));
        }
        if (!npmResClient && client) {
            console.log(i18n.npmInstallFailed(clientEnd, path.relative('.', client.clientDir)));
        }
    }

    // Run local dev server:
    console.log(i18n.runLocalServer);
    if (client) {
        console.log(`= ${serverEnd} =\n`)
        console.log(chalk.cyan(`    cd ${path.relative('.', server.serverDir)}\n    npm run dev\n`));
        console.log(`= ${clientEnd} =\n`)
        console.log(chalk.cyan(`    cd ${path.relative('.', client.clientDir)}\n    npm run dev\n`));
    }
    else {
        let cdPath = path.relative('.', server.serverDir);
        if (cdPath) {
            console.log(chalk.cyan(`    cd ${cdPath}`));
        }
        console.log(chalk.cyan(`    npm run dev\n`));
    }

    spinner.text = '';
    spinner.stop();
}

async function createServer(options: CreateOptions, registry: string | undefined) {
    // 配置
    const serverDirName = options.client === 'none' ? '.' : options.client === 'node' ? 'server' : 'backend';
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const serverDir = path.resolve(options.projectDir, serverDirName);
    const appName = path.basename(path.resolve(options.projectDir));

    // 创建项目目录
    await fs.ensureDir(options.projectDir);

    // 复制文件
    doing(i18n.copyFiles(serverDirName))
    await fs.ensureDir(serverDir);
    await copyRootFiles(path.join(tplDir, 'server'), serverDir, options.features.indexOf('unitTest') === -1 ? ['.mocharc.js'] : undefined);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
    await fs.copy(path.join(tplDir, 'server', '.vscode'), path.join(serverDir, '.vscode'), { recursive: true });

    // 纯后端 注释 sync 部分
    if (options.client === 'none') {
        let configContent = await fs.readFile(path.join(serverDir, 'tsrpc.config.ts'), 'utf-8');
        configContent = configContent.replace(/(sync:\s+\[\n)([\s\S]+)(\],)/, (_, p1: string, p2: string, p3: string) => {
            return p1 + p2.split('\n').map(v => v.replace(/^\s{8}/, '        // ')).join('\n') + p3;
        });
        await fs.writeFile(path.join(serverDir, 'tsrpc.config.ts'), configContent, 'utf-8');
    }

    // 单元测试
    if (options.features.indexOf('unitTest') > -1) {
        await copyTypeFolder('test', options.server, path.join(tplDir, 'server'), serverDir);
    }
    else {
        let content = await fs.readFile(path.join(serverDir, 'README.md'), 'utf-8');
        content = content.replace(/### Unit Test[\s\S]+npm run test\s*```/, '');
        await fs.writeFile(path.join(serverDir, 'README.md'), content, 'utf-8');
    }

    done();

    // 写入 package.json
    doing(i18n.genPackageJson(serverDirName))
    let packageJson = JSON.parse(await fs.readFile(path.join(serverDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${serverDirName}`;
    packageJson.scripts.sync = packageJson.scripts.sync.replace(/client/g, clientDirName);
    // 单元测试特性
    if (options.features.indexOf('unitTest') === -1) {
        delete packageJson.scripts.test;
        delete packageJson.devDependencies.mocha;
        delete packageJson.devDependencies['@types/mocha'];
    }
    // Symlink
    if (options.features.indexOf('symlink') > -1) {
        packageJson.scripts.sync = packageJson.scripts.sync.replace('tsrpc sync', 'tsrpc link');
    }
    await fs.writeFile(path.join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    done();

    // 安装依赖
    doing(`npm-check-update`)
    await ncu.run({
        packageFile: path.join(serverDir, 'package.json'),
        upgrade: true,
        target: 'minor',
        registry: registry
    });
    done();

    return {
        serverDir: serverDir,
        serverDirName: serverDirName
    };
}

async function createBrowserClient(options: CreateOptions, registry: string | undefined) {
    // 开始创建前端应用
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const clientDir = path.resolve(options.projectDir, clientDirName);
    const appName = path.basename(path.resolve(options.projectDir));

    // 复制文件
    doing(i18n.copyFiles(clientDirName))
    await fs.ensureDir(clientDir);
    await copyRootFiles(path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('public', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    done();

    // 写入 package.json
    doing(i18n.genPackageJson(clientDirName))
    let packageJson = JSON.parse(await fs.readFile(path.join(clientDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${clientDirName}`;
    await fs.writeFile(path.join(clientDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    done();

    // 安装依赖
    doing('npm-check-update')
    await ncu.run({
        packageFile: path.join(clientDir, 'package.json'),
        upgrade: true,
        target: 'minor',
        registry: registry
    });
    done();

    return {
        clientDir: clientDir,
        clientDirName: clientDirName
    }
}

async function copyRootFiles(fromDir: string, toDir: string, ignores?: string[]) {
    let dirs = await fs.readdir(fromDir);
    for (let v of dirs) {
        // ignores
        if (ignores?.includes(v)) {
            continue;
        }
        if ((await fs.stat(path.join(fromDir, v))).isFile()) {
            await fs.copyFile(path.join(fromDir, v), path.join(toDir, v.endsWith('__CTA') ? v.substr(0, v.length - 5) : v));
        }
    }
}

async function copyTypeFolder(folderName: string, type: string, fromDir: string, toDir: string) {
    if (await fs.pathExists(path.join(fromDir, `${folderName}-${type}`))) {
        await fs.copy(path.join(fromDir, `${folderName}-${type}`), path.join(toDir, folderName), { recursive: true });
    }
    else {
        await fs.copy(path.join(fromDir, folderName), path.join(toDir, folderName), { recursive: true });
    }
}

const spinner = ora({ spinner: 'material', text: '' });
let currentDoingText: string | undefined;
let finishedStep = 0;
function doing(text: string, doingPostFix: string = '...') {
    if (currentDoingText) {
        return;
    }
    currentDoingText = text;
    spinner.prefixText = chalk.yellow(` → ${++finishedStep}/${totalStep} ${text}${doingPostFix}`);
    spinner.start();
}
function done(succ: boolean = true, text?: string) {
    spinner.prefixText = '';
    if (currentDoingText) {
        text = `${finishedStep}/${totalStep} ${text ?? currentDoingText}`
        succ ? spinner.succeed(chalk.green(text)) : spinner.fail(chalk.red(text));
        currentDoingText = undefined;
    }
}