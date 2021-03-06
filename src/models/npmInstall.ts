import { exec } from "child_process";
import http from "http";
import https from "https";

export async function npmInstall(cmd: string, cwd: string): Promise<boolean> {
    return new Promise<boolean>(rs => {
        let child = exec(cmd, { cwd: cwd });
        child.on('exit', code => {
            rs(code ? false : true)
        })
    })
}

export async function getInstallEnv(): Promise<{ cmd: string, args: string[], pkgManager: 'npm' | 'yarn', registry?: string, pureCmd: string }> {
    let pkgManager = await getPkgManager();
    let registry = await getRegistry(pkgManager);
    let args: string[] = [];
    let pureCmd: string = '';

    if (pkgManager === 'npm') {
        args.push('install')
        if (registry) {
            args.push('--force');
        }
        pureCmd = 'npm install --force'
    }
    else if (pkgManager === 'yarn') {
        pureCmd = 'yarn';
    }

    if (registry) {
        args.push('--registry', registry);
    }

    return {
        cmd: pkgManager + ' ' + args.join(' '),
        pureCmd: pureCmd,
        args: args,
        pkgManager: pkgManager,
        registry: registry
    }
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
    taobao: 'https://registry.npmmirror.com'
}
async function getRegistry(command: 'yarn' | 'npm'): Promise<string | undefined> {
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
        return undefined;
    }

    // Choose faster registry
    let pings = await Promise.all([
        ping(defaultRegistry),
        ping(registries.taobao)
    ]);
    return pings[1] < pings[0] ? registries.taobao : undefined;
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