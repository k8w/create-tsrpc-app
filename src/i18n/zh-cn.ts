
export const i18nZhCn = {
    help: `
${('create-tsrpc-app '.green + '<项目目录>'.yellow).bold + ' [选项]'}

选项：
    -h, --help              查看帮助信息
    -v, --version           查看版本号
    -p, --presets <预设名>  使用预设配置（跳过交互式配置）
                            可选 ${'browser, react, vue2, vue3, server'.cyan}
`,
    server: '服务端',
    client: '客户端',
    frontend: '前端',
    backend: '后端',
    flagError: ' 错误 '.bgRed.white,
    flagSucc: ' ✅ 完成 '.green,
    canceled: '已取消'.gray,
    'confirm?': '确认？',

    // Entry
    presetsNotExist: (presets: string) => `Presets 不存在：${presets.yellow}`,

    // Input Create Options
    welcome: '=== 欢迎创建 TSRPC 应用 ==='.green.bold,
    inputProjectDir: '请输入要创建的项目目录名：',
    dirNotEmpty: '目标文件夹不为空，请先清空或删除目标文件夹再创建。',
    selectServerType: '请选择服务端项目类型：',
    httpShortService: 'HTTP 短连接服务',
    wsLongService: 'WebSocket 长连接服务',
    selectClientType: '请选择客户端项目类型：',
    browser: '浏览器',
    wxApp: '微信小程序',
    nodeJs: 'NodeJS',
    noClient: '不创建客户端项目',
    selectFrontFramework: '请选择前端使用的框架：',
    ffBrowser: '不使用框架' + ' (仅含 webpack 基础配置)'.yellow,
    ffReact: 'React',
    ffVue2: 'Vue 2.x',
    ffVue3: 'Vue 3.x',
    selectFeatures: '请按勾选需要的特性：',
    featureUnitTest: '服务端单元测试' + '（Mocha）'.yellow,
    featureSymlink: '使用 Symlink 同步共享代码',

    // CreateApp
    checkNpmEnv: '检测 NPM 环境',
    npmInstall: (endName: string) => `安装 "${endName}" 下的 NPM 依赖`,
    mayLongPleaseWait: '（可能略久，请稍等）...',
    createApp: (appName: string) => `创建 TSRPC 应用: ${appName.green.bold}`,
    createAppSucc: '✅ TSRPC APP 创建成功，进入项目目录，执行以下命令启动本地开发：\n'.green,
    createAppSuccWithProblems: '🟨 TSRPC APP 创建完成，但存在以下问题：\n'.yellow,
    npmInstallFailed: (endName: string, dirName: string) => `❌ ${endName} "npm install" 失败，可在项目目录执行以下命令手动安装 `.red +
        `\n\n    cd ${dirName}\n    npm install\n`.cyan,
    copyFiles: (dirName: string) => `复制文件到 "${dirName}"`,
    genPackageJson: (dirName: string) => `生成 "${dirName}/package.json"`,
}