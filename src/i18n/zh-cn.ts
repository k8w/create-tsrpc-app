import chalk from "chalk";

export const i18nZhCn = {
    help: `
${chalk.bold(chalk.green('create-tsrpc-app ') + chalk.yellow('<项目目录>')) + ' [选项]'}

选项：
    -h, --help              查看帮助信息
    -v, --version           查看版本号
    -p, --preset <预设名>  使用预设配置（跳过交互式配置）
                            可选 ${chalk.cyan('browser, react, vue3, server')}
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
    presetNotExist: (preset: string) => `Preset 不存在：${chalk.yellow(preset)}`,

    // Input Create Options
    inputProjectDir: '请输入要创建的项目目录名：',
    dirNotEmpty: `目标文件夹不为空，以${chalk.yellow('覆盖方式')}继续？`,

    selectProjectType: '请选择要创建的项目类型：',
    projectType: {
        react: 'React + 后端',
        vue3: 'Vue 3 + 后端',
        nativeBrowser: '前端（无框架） + 后端',
        server: '仅后端',
    },
    projectCategory: {
        browser: ' ====== 浏览器全栈项目 ====== ',
        server: ' ========== 其  它 ========== ',
    },

    selectServerType: '请选择传输协议：',
    httpShortService: 'HTTP 短连接',
    wsLongService: 'WebSocket 长连接',

    selectFeatures: '选择附加功能：',

    // CreateApp
    checkNpmEnv: '检测 NPM 环境',
    npmInstall: `安装 NPM 依赖`,
    mayLongPleaseWait: '（可能略久，请稍等）...',
    createApp: (appName: string) => `创建 TSRPC 应用: ${chalk.green.bold(appName)}`,
    createAppSucc: chalk.green('✅ TSRPC APP 创建成功。\n'),
    createAppSuccWithProblems: chalk.yellow('🟨 TSRPC APP 创建完成，但存在以下问题：\n'),
    runLocalServer: '运行本地开发服务器：\n',
    npmInstallFailed: (endName: string, dirName: string, pureCmd: string) => chalk.red(`❌ ${endName} "${pureCmd}" 失败，可在项目目录执行以下命令手动安装 ` +
        `\n\n    cd ${dirName}\n    ${pureCmd}\n`),
    copyFiles: (dirName: string) => `复制文件到 "${dirName}"`,
    genPackageJson: (dirName: string) => `生成 "${dirName}/package.json"`,

    linkFailed: '创建 Symlink 授权失败，请在授权弹框选择 "是" 以继续：',
    linkRetry: '重 试',
    linkJunction: '改为创建 Junction（不推荐）'
}