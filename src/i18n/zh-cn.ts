import chalk from "chalk";

export const i18nZhCn = {
    help: `
${chalk.bold(chalk.green('create-tsrpc-app ') + chalk.yellow('<项目目录>')) + ' [选项]'}

选项：
    -h, --help              查看帮助信息
    -v, --version           查看版本号
    -p, --presets <预设名>  使用预设配置（跳过交互式配置）
                            可选 ${chalk.cyan('browser, react, vue2, vue3, server')}
`,
    welcome: (version: string) => chalk.cyan(`=== 欢迎使用 ${chalk.bold('create-tsrpc-app')} 版本 ${version} ===\n`),
    server: '服务端',
    client: '客户端',
    frontend: '前端',
    backend: '后端',
    flagError: chalk.bgRed.white(' 错误 '),
    flagSucc: chalk.green(' ✅ 完成 '),
    canceled: chalk.gray('已取消'),
    'confirm?': '确认？',

    // Entry
    presetsNotExist: (presets: string) => `Presets 不存在：${chalk.yellow(presets)}`,

    // Input Create Options
    inputProjectDir: '请输入要创建的项目目录名：',
    dirNotEmpty: '目标文件夹不为空，请先清空或删除目标文件夹再创建。',

    selectProjectType: '请选择要创建的项目类型：',
    projectType: {
        react: 'React + 后端',
        vue2: 'Vue 2 + 后端',
        vue3: 'Vue 3 + 后端',
        nativeBrowser: '原生前端 + 后端',
        server: '仅后端',
    },
    projectCategory: {
        browser: ' = 浏览器全栈项目 = ',
        server: ' = 其它 = ',
    },

    selectServerType: '请选择传输协议：',
    httpShortService: 'HTTP 短连接',
    wsLongService: 'WebSocket 长连接',

    // CreateApp
    checkNpmEnv: '检测 NPM 环境',
    npmInstall: (endName: string) => `安装 "${endName}" 下的 NPM 依赖`,
    mayLongPleaseWait: '（可能略久，请稍等）...',
    createApp: (appName: string) => `创建 TSRPC 应用: ${chalk.green.bold(appName)}`,
    createAppSucc: chalk.green('✅ TSRPC APP 创建成功。\n'),
    createAppSuccWithProblems: chalk.yellow('🟨 TSRPC APP 创建完成，但存在以下问题：\n'),
    runLocalServer: '运行本地开发服务器：\n',
    npmInstallFailed: (endName: string, dirName: string) => chalk.red(`❌ ${endName} "npm install" 失败，可在项目目录执行以下命令手动安装 ` +
        `\n\n    cd ${dirName}\n    npm install\n`),
    copyFiles: (dirName: string) => `复制文件到 "${dirName}"`,
    genPackageJson: (dirName: string) => `生成 "${dirName}/package.json"`,
}