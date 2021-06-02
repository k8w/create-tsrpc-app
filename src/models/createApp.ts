import child_process from "child_process";
import fs from "fs-extra";
import ncu from "npm-check-updates";
import ora from "ora";
import path from "path";
import { CreateOptions } from "./CreateOptions";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, '../templates') : path.resolve(__dirname, '../../templates');
const spinner = ora('');

export async function createApp(options: CreateOptions) {
    console.log('✔ 开始创建项目'.green);
    spinner.text = '';
    spinner.color = 'yellow';

    // 创建项目
    let server = await createServer(options);
    let client: { clientDir: string, clientDirName: string } | undefined;
    if (options.client === 'browser' || options.client === 'react' || options.client.startsWith('vue')) {
        client = await createBrowserClient(options);
    }

    // 安装依赖
    let npmResServer = false;
    let npmResClient = !client;
    spinner.text = '安装服务端项目依赖'.green;
    spinner.start();
    npmResServer = await npmInstall(server.serverDir);
    npmResServer ? spinner.succeed() : spinner.fail()
    if (client) {
        spinner.text = '安装客户端项目依赖'.green;
        spinner.start();
        npmResClient = await npmInstall(client.clientDir);
        npmResClient ? spinner.succeed() : spinner.fail()
    }

    console.log('\n=================================================\n'.green);

    if (npmResServer && npmResClient) {
        console.log('✅ TSRPC APP 创建成功，运行以下命令启动：\n'.green);
        if (client) {
            console.log(`    cd ${server.serverDirName}\n    npm run dev\n`.cyan);
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

async function createServer(options: CreateOptions) {
    // 配置
    const serverDirName = options.client === 'none' ? '.' : options.client === 'node' ? 'server' : 'backend';
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const serverDir = path.resolve(options.projectDir, serverDirName);
    const appName = path.basename(options.projectDir);

    // 创建项目目录
    await fs.ensureDir(options.projectDir);

    // 开始创建后端应用
    console.log('✔ 开始创建服务端应用'.green);

    // 复制文件
    spinner.text = '复制文件'.green;
    spinner.start();
    await fs.ensureDir(serverDir);
    await copyRootFiles(path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('test', options.server, path.join(tplDir, 'server'), serverDir);
    spinner.succeed();

    // 写入 package.json
    spinner.text = '更新 package.json'.green
    spinner.start();
    let packageJson = JSON.parse(await fs.readFile(path.join(serverDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${serverDirName}`;
    packageJson.scripts.sync = packageJson.scripts.sync.replace(/client/g, clientDirName);
    await fs.writeFile(path.join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    spinner.succeed();

    // 安装依赖
    spinner.text = '更新依赖包版本信息'.green;
    spinner.start();
    await ncu.run({
        packageFile: path.join(serverDir, 'package.json'),
        upgrade: true,
        target: 'minor'
    });
    spinner.succeed();
    // console.log('开始安装依赖');
    // execSync('npm i --registry https://registry.npm.taobao.org', serverDir);
    console.log('✔ 后端应用创建完成'.green);

    return {
        serverDir: serverDir,
        serverDirName: serverDirName
    };
}

async function createBrowserClient(options: CreateOptions) {
    // 开始创建前端应用
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const clientDir = path.resolve(options.projectDir, clientDirName);
    const appName = path.basename(options.projectDir);

    console.log('✔ 开始创建客户端应用'.green);

    // 复制文件
    spinner.text = '复制文件'.green;
    spinner.start();
    await fs.ensureDir(clientDir);
    await copyRootFiles(path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('public', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    spinner.succeed();

    // 写入 package.json
    spinner.text = '更新 package.json'.green;
    spinner.start();
    let packageJson = JSON.parse(await fs.readFile(path.join(clientDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${clientDirName}`;
    await fs.writeFile(path.join(clientDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    spinner.succeed();

    // 安装依赖
    spinner.text = '更新依赖包版本信息'.green;
    spinner.start();
    await ncu.run({
        packageFile: path.join(clientDir, 'package.json'),
        upgrade: true,
        target: 'minor'
    });
    spinner.succeed();
    // console.log('开始安装依赖');
    // execSync('npm i --registry https://registry.npm.taobao.org', clientDir);

    console.log('✔ 客户端应用创建完成'.green);

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

function npmInstall(dir: string): Promise<boolean> {
    return new Promise<boolean>(rs => {
        child_process.exec('npm i', err => {
            rs(err ? false : true)
        })
    })
}