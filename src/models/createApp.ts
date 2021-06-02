import child_process from "child_process";
import fs from "fs-extra";
import ncu from "npm-check-updates";
import path from "path";
import { CreateOptions } from "./CreateOptions";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, '../templates') : path.resolve(__dirname, '../../templates');

export async function createApp(options: CreateOptions) {
    console.log('createApp', options);

    await createServer(options);
    if (options.client === 'browser' || options.client === 'react' || options.client.startsWith('vue')) {
        await createBrowserClient(options);
    }

    console.log('✅ TSRPC APP 创建完成'.green);
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
    console.log('开始创建服务端应用...');
    await fs.ensureDir(serverDir);
    console.log('复制文件...');
    // 复制文件
    await copyRootFiles(path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
    await copyTypeFolder('test', options.server, path.join(tplDir, 'server'), serverDir);
    // 写入 package.json
    console.log('更新 package.json ...');
    let packageJson = JSON.parse(await fs.readFile(path.join(serverDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${serverDirName}`;
    packageJson.scripts.sync = packageJson.scripts.sync.replace(/client/g, clientDirName);
    await fs.writeFile(path.join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    // 安装依赖
    console.log('更新版本信息...');
    await ncu.run({
        packageFile: path.join(serverDir, 'package.json'),
        upgrade: true,
        target: 'minor'
    });
    console.log('开始安装依赖...');
    execSync('npm i --registry https://registry.npm.taobao.org', serverDir);
    console.log('✅ 后端应用创建完成'.green);
}

async function createBrowserClient(options: CreateOptions) {
    // 开始创建前端应用
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const clientDir = path.resolve(options.projectDir, clientDirName);
    const appName = path.basename(options.projectDir);

    console.log('开始创建客户端应用...');
    await fs.ensureDir(clientDir);
    console.log('复制文件...');
    await copyRootFiles(path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('src', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    await copyTypeFolder('public', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    // 写入 package.json
    console.log('更新 package.json ...');
    let packageJson = JSON.parse(await fs.readFile(path.join(clientDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${clientDirName}`;
    await fs.writeFile(path.join(clientDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    // 安装依赖
    console.log('更新版本信息...');
    await ncu.run({
        packageFile: path.join(clientDir, 'package.json'),
        upgrade: true,
        target: 'minor'
    });
    console.log('开始安装依赖...');
    execSync('npm i --registry https://registry.npm.taobao.org', clientDir);
    console.log('✅ 客户端应用创建完成'.green);
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

function execSync(cmd: string, cwd: string) {
    child_process.execSync(cmd, {
        stdio: 'inherit',
        cwd: cwd
    })
}