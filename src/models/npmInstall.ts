import { exec } from "child_process";
import http from "http";
import https from "https";

export async function npmInstall(cwd: string): Promise<boolean> {
    let cmd = await getInstallCommand();
    return new Promise<boolean>(rs => {
        exec(cmd, { cwd: cwd }, err => {
            rs(err ? false : true)
        })
    })
}

let promiseGetCmd: Promise<string> | undefined;
export function getInstallCommand(): Promise<string> {
    if (promiseGetCmd) {
        return promiseGetCmd;
    }

    return promiseGetCmd = getPkgManager().then(pkg => {
        let cmd = pkg === 'npm' ? 'npm i' : 'yarn';
        return getRegistry(pkg).then(r => r ? `${cmd} --registry ${r}` : cmd);
    })
}

async function getPkgManager(): Promise<'npm' | 'yarn'> {
    return new Promise(rs => {
        exec('yarn --version', e => {
            rs(!!e ? 'npm' : 'yarn')
        })
    });
}

const registries = {
    npm: 'https://registry.npmjs.org',
    yarn: 'https://registry.yarnpkg.com',
    taobao: 'https://registry.npm.taobao.org'
}
async function getRegistry(command: 'yarn' | 'npm'): Promise<string | null> {
    // User has configured custom registry, respect that
    const defaultRegistry = registries[command];
    let userCurrent: string | undefined;
    try {
        userCurrent = (await execa(`${command} config get registry`));
    }
    catch {
        try {
            // Yarn 2 uses `npmRegistryServer` instead of `registry`
            userCurrent = (await execa(`${command} config get npmRegistryServer`));
        }
        catch {
            userCurrent = defaultRegistry;
        }
    }
    if (userCurrent.trim().replace(/\/$/, '') !== defaultRegistry) {
        console.log('default', userCurrent.replace(/\/$/, ''), defaultRegistry)
        return null;
    }

    // Choose faster registry
    let pings = await Promise.all([
        ping(defaultRegistry),
        ping(registries.taobao)
    ]);
    return pings[1] < pings[0] ? registries.taobao : null;
}

async function execa(cmd: string): Promise<string> {
    return new Promise((rs, rj) => {
        exec(cmd, (err, stdout) => {
            if (err) {
                rj(err);
                return;
            }
            rs(stdout);
        })
    })
}

async function ping(url: string, timeout: number = 3000): Promise<number> {
    let start = Date.now()
    return new Promise((rs, rj) => {
        (url.startsWith('https') ? https : http).get(url, res => {
            res.on('data', () => { })
            res.on('end', () => {
                rs(Date.now() - start);
            });
        }).on('error', () => {
            rs(Infinity);
        });
        setTimeout(() => {
            rs(Infinity);
        }, timeout);
    })
}