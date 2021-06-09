export const i18nEnUs = {
    help: `
${('create-tsrpc-app '.green + '<project-dir>'.yellow).bold + ' [options]'}

Options：
    -h, --help                  Output help information
    -v, --version               Output version number
    -p, --presets <presetName>  Use preset（skip interactive configuration）
                                Presets: ${'browser, react, vue2, vue3, server'.cyan}
`,
    welcome: (version: string) => `=== Welcome to ${'create-tsrpc-app'.bold} version ${version} ===\n`.cyan,
    server: 'server',
    client: 'client',
    frontend: 'frontend',
    backend: 'backend',
    flagError: ' ERROR '.bgRed.white,
    flagSucc: ' ✅ SUCCESS '.green,
    canceled: 'CANCELED'.gray,
    'confirm?': 'CONFIRM?',

    // Entry
    presetsNotExist: (presets: string) => `Presets not exists：${presets.yellow}`,

    // Input Create Options
    inputProjectDir: 'Input project directory name: ',
    dirNotEmpty: 'The target directory is not empty, please clear or delete it and try again.',
    selectServerType: 'Select server project type: ',
    httpShortService: 'HTTP short connection',
    wsLongService: 'WebSocket long connection',
    selectClientType: 'Select client project type: ',
    browser: 'Browser',
    wxApp: 'WeChat Miniapp',
    nodeJs: 'NodeJS',
    noClient: 'NO client project',
    selectFrontFramework: 'Select frontend framework: ',
    ffBrowser: 'No framework' + ' (only webpack basic configuration)'.yellow,
    ffReact: 'React',
    ffVue2: 'Vue 2.x',
    ffVue3: 'Vue 3.x',
    selectFeatures: 'Check needed features: ',
    featureUnitTest: 'Server Unit Test' + '（Mocha）'.yellow,
    featureSymlink: 'Use Symlink to sync shared codes',

    // CreateApp
    checkNpmEnv: 'Check NPM environment',
    npmInstall: (endName: string) => `Install NPM dependencies of "${endName}"`,
    mayLongPleaseWait: '(May take a while, please wait)...',
    createApp: (appName: string) => `Create TSRPC APP: ${appName.green}`,
    createAppSucc: '✅ TSRPC APP created successfully.\n'.green,
    createAppSuccWithProblems: '🟨 TSRPC APP created, but with problems：\n'.yellow,
    npmInstallFailed: (endName: string, dirName: string) => `❌ "npm install" failed at ${endName}, you can re-execute it mannually. `.red +
        `\n\n    cd ${dirName}\n    npm install\n`.red,
    runLocalServer: 'Run local dev server:\n',
    copyFiles: (dirName: string) => `Copy files to "${dirName}"`,
    genPackageJson: (dirName: string) => `Generate "${dirName}/package.json"`,
}