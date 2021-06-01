import child_process from "child_process";
import fs from "fs-extra";
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
    const serverDir = path.resolve(options.projectDir, serverDirName);

    // 创建项目目录
    fs.ensureDirSync(options.projectDir);

    // 开始创建后端应用
    console.log('开始创建服务端应用...');
    fs.ensureDirSync(serverDir);
    console.log('复制文件...');
    // 复制文件
    copyRootFilesSync(path.join(tplDir, 'server'), serverDir);
    copyTypeFolderSync('src', options.server, path.join(tplDir, 'server'), serverDir);
    copyTypeFolderSync('test', options.server, path.join(tplDir, 'server'), serverDir);

    // TODO 改写 package.json
    // 安装依赖
    console.log('开始安装依赖...');
    execSync('npm i --registry https://registry.npm.taobao.org', serverDir);
    execSync('npm update', serverDir);
    console.log('✅ 后端应用创建完成'.green);
}

async function createBrowserClient(options: CreateOptions) {
    // 开始创建前端应用
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const clientDir = path.resolve(options.projectDir, clientDirName);

    console.log('开始创建客户端应用...');
    fs.ensureDirSync(clientDir);
    console.log('复制文件...');
    copyRootFilesSync(path.join(tplDir, `client-${options.client}`), clientDir);
    copyTypeFolderSync('src', options.server, path.join(tplDir, `client-${options.client}`), clientDir);
    copyTypeFolderSync('public', options.server, path.join(tplDir, `client-${options.client}`), clientDir);

    // TODO 改写文件 package.json
    // 安装依赖
    console.log('开始安装依赖...');
    execSync('npm i --registry https://registry.npm.taobao.org', clientDir);
    execSync('npm update', clientDir);
    console.log('✅ 客户端应用创建完成'.green);
}

function copyRootFilesSync(fromDir: string, toDir: string) {
    fs.readdirSync(fromDir).forEach(v => {
        if (v !== 'package-lock.json' && fs.statSync(path.join(fromDir, v)).isFile()) {
            fs.copyFileSync(path.join(fromDir, v), path.join(toDir, v));
        }
    })
}

function copyTypeFolderSync(folderName: string, type: string, fromDir: string, toDir: string) {
    if (fs.existsSync(path.join(fromDir, `${folderName}-${type}`))) {
        fs.copySync(path.join(fromDir, `${folderName}-${type}`), path.join(toDir, folderName), { recursive: true });
    }
    else {
        fs.copySync(path.join(fromDir, folderName), path.join(toDir, folderName), { recursive: true });
    }
}

function execSync(cmd: string, cwd: string) {
    child_process.execSync(cmd, {
        stdio: 'inherit',
        cwd: cwd
    })
}