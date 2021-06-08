import fs from "fs-extra";
import ncu from "npm-check-updates";
import ora from "ora";
import path from "path";
import { i18n } from "../i18n/i18n";
import { CreateOptions } from "./CreateOptions";
import { getInstallEnv, npmInstall } from "./npmInstall";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, './templates') : path.resolve(__dirname, '../../templates');
let totalStep = 0;

const SCREEN_WIDTH = 40;

export async function createApp(options: CreateOptions) {
    spinner.text = '';
    spinner.color = 'yellow';

    // 计算步骤数量 后端4 前端5 NPM1
    totalStep = 5 + (options.client === 'none' ? 0 : 5);

    // 判断安装环境
    doing(i18n.checkNpmEnv);
    let installEnv = await getInstallEnv();
    done(true, `${i18n.checkNpmEnv}: `
        + 'Command: '.cyan
        + (installEnv.pkgManager.yellow.bold)
        + (installEnv.registry ? (', Registry: '.cyan + installEnv.registry.yellow) : ''));

    // 创建项目
    let server = await createServer(options, installEnv.registry);
    let client: { clientDir: string, clientDirName: string } | undefined;
    if (options.client === 'browser' || options.client === 'react' || options.client.startsWith('vue')) {
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
    doing(i18n.npmInstall(server.serverDirName), i18n.mayLongPleaseWait),
        npmResServer = await npmInstall(installEnv.cmd, server.serverDir);
    done(npmResServer);
    if (client) {
        doing(i18n.npmInstall(client.clientDirName), i18n.mayLongPleaseWait)
        npmResClient = await npmInstall(installEnv.cmd, client.clientDir);
        done(npmResClient);
    }

    console.log(`\n${'='.repeat(SCREEN_WIDTH)}\n`.green);

    const serverEnd = server.serverDirName === 'server' ? i18n.server : i18n.backend;
    const clientEnd = client?.clientDirName === 'client' ? i18n.client : i18n.frontend;

    if (npmResServer && npmResClient) {
        console.log(i18n.createAppSucc);
        if (client) {
            console.log(`    = ${serverEnd} =\n`)
            console.log(`    cd ${path.relative('.', server.serverDir)}\n    npm run dev\n`.cyan);
            console.log(`    = ${clientEnd} =\n`)
            console.log(`    cd ${path.relative('.', client.clientDir)}\n    npm run dev\n`.cyan);
        }
        else {
            let cdPath = path.relative('.', server.serverDir);
            if (cdPath) {
                console.log(`    cd ${cdPath}`.cyan);
            }
            console.log(`    npm run dev\n`.cyan);
        }
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

    spinner.text = '';
    spinner.stop();
}

async function createServer(options: CreateOptions, registry: string | undefined) {
    // 配置
    const serverDirName = options.client === 'none' ? '.' : options.client === 'node' ? 'server' : 'backend';
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const serverDir = path.resolve(options.projectDir, serverDirName);
    const appName = path.basename(options.projectDir);

    // 创建项目目录
    await fs.ensureDir(options.projectDir);

    // 复制文件
    doing(i18n.copyFiles(serverDirName))
    await fs.ensureDir(serverDir);
    await copyRootFiles(path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
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
    const appName = path.basename(options.projectDir);

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

async function copyRootFiles(fromDir: string, toDir: string) {
    let dirs = await fs.readdir(fromDir);
    for (let v of dirs) {
        if (v !== 'package-lock.json' && (await fs.stat(path.join(fromDir, v))).isFile()) {
            await fs.copyFile(path.join(fromDir, v), path.join(toDir, v));
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

const spinner = ora('');
let currentDoingText: string | undefined;
let finishedStep = 0;
function doing(text: string, doingPostFix: string = '...') {
    if (currentDoingText) {
        return;
    }
    currentDoingText = text;
    spinner.text = `${++finishedStep}/${totalStep} ${text}${doingPostFix}`.yellow;
    spinner.start();
}
function done(succ: boolean = true, text?: string) {
    if (currentDoingText) {
        text = `${finishedStep}/${totalStep} ${text ?? currentDoingText}`
        succ ? spinner.succeed(text.green) : spinner.fail(text.red);
        currentDoingText = undefined;
    }
}