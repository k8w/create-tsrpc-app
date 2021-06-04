import fs from "fs-extra";
import ncu from "npm-check-updates";
import ora from "ora";
import path from "path";
import { CreateOptions } from "./CreateOptions";
import { getInstallEnv, npmInstall } from "./npmInstall";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, '../templates') : path.resolve(__dirname, '../../templates');
let totalStep = 0;

export async function createApp(options: CreateOptions) {
    spinner.text = '';
    spinner.color = 'yellow';

    // 计算步骤数量 后端4 前端5 NPM1
    totalStep = 5 + (options.client === 'none' ? 0 : 5);

    // 判断安装环境
    doing('检测 NPM 环境');
    let installEnv = await getInstallEnv();
    done(true, '检测 NPM 环境: ' + `${installEnv.pkgManager} ${installEnv.registry ?? `(registry=${installEnv.registry})`}`.cyan);

    // 创建项目
    let server = await createServer(options, installEnv.registry);
    let client: { clientDir: string, clientDirName: string } | undefined;
    if (options.client === 'browser' || options.client === 'react' || options.client.startsWith('vue')) {
        client = await createBrowserClient(options, installEnv.registry);

        // Sync 演示代码
        if (options.features.indexOf('symlink') > -1) {
            doing('Init symlink');
            let target = path.relative(path.join(client.clientDir, 'src'), path.join(server.serverDir, 'src/shared'));
            await fs.symlink(target, path.join(client.clientDir, 'src/shared'), 'junction');
        }
        else {
            doing('First sync');
            await fs.copy(path.join(server.serverDir, 'src/shared'), path.join(client.clientDir, 'src/shared'), { recursive: true })
        }
        done();
    }

    // 安装依赖
    let npmResServer = false;
    let npmResClient = !client;
    doing(`安装服务端 NPM 依赖`, '（可能略久，请稍等）...')
    npmResServer = await npmInstall(installEnv.cmd, server.serverDir);
    done(npmResServer);
    if (client) {
        doing(`安装客户端 NPM 依赖`, '（可能略久，请稍等）...')
        npmResClient = await npmInstall(installEnv.cmd, client.clientDir);
        done(npmResClient);
    }

    console.log('\n=================================================\n'.green);

    if (npmResServer && npmResClient) {
        console.log('✅ TSRPC APP 创建成功，运行以下命令启动本地开发：\n'.green);
        if (client) {
            console.log(`    = ${server.serverDirName === 'server' ? '服务' : '后'}端 =\n`)
            console.log(`    cd ${server.serverDirName}\n    npm run dev\n`.cyan);
            console.log(`    = ${client.clientDirName === 'client' ? '客户' : '前'}端 =\n`)
            console.log(`    cd ${client.clientDirName}\n    npm run dev\n`.cyan);
        }
        else {
            console.log(`    npm run dev\n`.cyan);
        }
    }
    else {
        console.log('🟨 TSRPC APP 创建完成，但存在以下问题：\n'.yellow);
        if (!npmResServer) {
            console.log(`❌ 服务端 npm install 失败，可执行以下命令手动安装 `.red, `\n\n    cd ${server.serverDirName}\n    npm install\n`);
        }
        if (!npmResClient) {
            console.log(`❌ 客户端 npm install 失败，可执行以下命令手动安装 `.red, `\n\n    cd ${client!.clientDirName}\n    npm install\n`);
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
    doing('复制服务端文件')
    await fs.ensureDir(serverDir);
    await copyRootFiles(path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
    // 单元测试
    if (options.features.indexOf('unitTest') > -1) {
        await copyTypeFolder('test', options.server, path.join(tplDir, 'server'), serverDir);
    }
    else {
        let content = await fs.readFile(path.join(serverDir, 'README.md'), 'utf-8');
        content = content.replace(/### Run unit test\s*```\s*npm run test\s*```/, '');
        await fs.writeFile(path.join(serverDir, 'README.md'), content, 'utf-8');
    }

    done();

    // 写入 package.json
    doing('生成 package.json')
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
    doing('npm-check-update')
    await ncu.run({
        packageFile: path.join(serverDir, 'package.json'),
        upgrade: true,
        target: 'minor',
        registry: registry
    });
    done();
    // console.log('开始安装依赖');
    // execSync('npm i --registry https://registry.npm.taobao.org', serverDir);

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
    doing('复制客户端文件')
    await fs.ensureDir(clientDir);
    await copyRootFiles(path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('public', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    done();

    // 写入 package.json
    doing('生成 package.json')
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
    // console.log('开始安装依赖');
    // execSync('npm i --registry https://registry.npm.taobao.org', clientDir);

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