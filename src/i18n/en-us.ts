import chalk from "chalk";

export const i18nEnUs = {
    help: `
${chalk.bold(chalk.green('create-tsrpc-app ') + chalk.yellow('<project-dir>')) + ' [options]'}

Options：
    -h, --help                  Output help information
    -v, --version               Output version number
    -p, --presets <presetName>  Use preset（skip interactive configuration）
                                Presets: ${chalk.cyan('browser, react, vue2, vue3, server')}
`,
    welcome: (version: string) => chalk.cyan(`=== Welcome to ${chalk.bold('create-tsrpc-app')} version ${version} ===\n`),
    server: 'server',
    client: 'client',
    frontend: 'frontend',
    backend: 'backend',
    flagError: chalk.bgRed.white(' ERROR '),
    flagSucc: chalk.green(' ✅ SUCCESS '),
    canceled: chalk.gray('CANCELED'),
    'confirm?': 'CONFIRM?',

    // Entry
    presetsNotExist: (presets: string) => `Presets not exists：${chalk.yellow(presets)}`,

    // Input Create Options
    inputProjectDir: 'Input project directory name: ',
    dirNotEmpty: 'The target directory is not empty, please clear or delete it and try again.',

    selectProjectType: 'Please select the project type: ',
    projectType: {
        react: 'React + backend',
        vue2: 'Vue 2 + backend',
        vue3: 'Vue 3 + backend',
        nativeBrowser: 'Frontend (no framework) + backend',
        server: 'Backend only',
    },
    projectCategory: {
        browser: ' ========== Full-stack project ========== ',
        server: ' ================ Other ================= ',
    },

    selectServerType: 'Please select the transportation protocol: ',
    httpShortService: 'HTTP short connection',
    wsLongService: 'WebSocket long connection',

    // CreateApp
    checkNpmEnv: 'Check NPM environment',
    npmInstall: `Install NPM dependencies`,
    mayLongPleaseWait: '(May take a while, please wait)...',
    createApp: (appName: string) => `Create TSRPC APP: ${chalk.green(appName)}`,
    createAppSucc: chalk.green('✅ TSRPC APP created successfully.\n'),
    createAppSuccWithProblems: chalk.yellow('🟨 TSRPC APP created, but with problems：\n'),
    npmInstallFailed: (endName: string, dirName: string) => chalk.red(`❌ "npm install" failed at ${endName}, you can re-execute it mannually. ` +
        `\n\n    cd ${dirName}\n    npm install\n`),
    runLocalServer: 'Run local dev server:\n',
    copyFiles: (dirName: string) => `Copy files to "${dirName}"`,
    genPackageJson: (dirName: string) => `Generate "${dirName}/package.json"`,
}