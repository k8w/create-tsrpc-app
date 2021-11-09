import chalk from "chalk";
import { exec } from 'child_process';
import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import { i18n } from "../i18n/i18n";
import { spinner } from "./spinner";

const resPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, './res') : path.resolve(__dirname, '../../res');

export async function ensureSymlinks(confs: { src: string, dst: string }[], isElevate?: boolean) {
    // 通过 elevate 运行的结果，undefined 代表尚未通过 elevate 运行
    let elevateResult: boolean | undefined;
    let createJunction: boolean | undefined;

    for (let conf of confs) {
        let { src, dst } = conf;
        if (elevateResult) {
            // console.log(`✔ ${createJunction ? i18n.junction : i18n.link} ${path.resolve(src)} -> ${path.resolve(dst)}`);
            continue;
        }

        await fs.ensureDir(src);

        // Try first time
        let err = await fs.ensureSymlink(src, dst, createJunction ? 'junction' : 'dir').catch(e => e);

        // 创建失败（文件已存在）
        if (err?.code === 'EEXIST') {
            // 删除
            await fs.remove(dst);
            // 然后重试
            err = await fs.ensureSymlink(src, dst, createJunction ? 'junction' : 'dir').catch(e => e);
        }

        // Windows 下无权限
        if (!isElevate && process.platform === 'win32' && err?.code === 'EPERM') {
            // 尚未尝试过提权，提权重试
            while (elevateResult === undefined) {
                // 提权执行
                let elevateCmd = `"${path.resolve(resPath, 'elevate.cmd')}" "${process.execPath}" ${process.execArgv.join(' ')} "${process.argv[1]}" --link-elevate="${encodeURIComponent(JSON.stringify(confs))}"`;
                await new Promise(rs => {
                    exec(elevateCmd).on('close', rs);
                });

                // 由于 elevate 的调起机制，无法获取返回结果
                // 所以通过轮询来检测，最多等待 5 秒
                // doing(i18n.elevatingForLink);
                let startTime = Date.now();
                while (Date.now() - startTime <= 5000) {
                    // 普通重试，验证提权结果
                    err = await fs.ensureSymlink(src, dst, 'dir').catch(e => e);
                    elevateResult = err?.code !== 'EPERM';

                    if (elevateResult) {
                        break;
                    }
                    else {
                        await new Promise(rs => setTimeout(rs, 500));
                    }
                }
                // done(!!elevateResult);

                // 提权失败，询问是否创建 junction
                if (!elevateResult) {
                    spinner.stop();
                    let answer: 'retry' | 'junction' = (await inquirer.prompt({
                        type: 'list',
                        message: chalk.yellow(i18n.linkFailed),
                        choices: [
                            { name: i18n.linkRetry, value: 'retry' },
                            { name: i18n.linkJunction, value: 'junction' },
                        ],
                        name: 'res'
                    })).res;
                    spinner.start();

                    // 清除结果，重试
                    if (answer === 'retry') {
                        elevateResult = undefined;
                    }
                    else {
                        createJunction = true;
                    }
                }
            }

            // 提权失败，创建 junction
            if (elevateResult === false && createJunction) {
                err = await fs.ensureSymlink(src, dst, 'junction').catch(e => e);
            }
        }

        // Fail
        if (err) {
            if (isElevate) {
                continue;
            }
            else {
                throw err;
            }
        }

        // Success
        // console.log(chalk.green(`✔ ${createJunction ? i18n.junction : i18n.link} ${path.resolve(src)} -> ${path.resolve(dst)}`));
    }
}