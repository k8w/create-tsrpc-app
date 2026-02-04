import chalk from "chalk";

export const i18nZhCn = {
    help: `
${chalk.bold(chalk.green('create-tsrpc-app ') + chalk.yellow('<项目目录>')) + ' [选项]'}

选项：
    -h, --help                  查看帮助信息
    -v, --version               查看版本号
    -p, --preset <预设名>       使用预设配置（跳过交互式配置）
                                可选 ${chalk.cyan('browser, react, vue3, server')}
    -e, --example <名称>        从示例创建项目
                                ${chalk.gray('官方示例：')} ${chalk.cyan('ecommerce-admin')}
                                ${chalk.gray('GitHub：')} ${chalk.cyan('user/repo')} 或 ${chalk.cyan('user/repo#branch')}
    --from-example              进入示例选择界面 ${chalk.gray('(适用于 CI/脚本)')}
    --no-example                跳过示例选择 ${chalk.gray('(适用于 CI/脚本)')}
    --list-examples             列出所有可用示例
    --refresh-registry          强制刷新示例注册表缓存
    --clear-cache               清除所有缓存的示例和注册表
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
    selectAIEditors: '选择要支持的 AI 编辑器：',
    aiEditors: {
        claude: 'Claude Code (.claude/skills + CLAUDE.md)',
        opencode: 'OpenCode (.opencode/rules + AGENTS.md)',
        trae: 'TRAE (.trae/skills)'
    },
    checkboxKeys: {
        'toggle': '切换',
        'select all': '全选',
        'invert selection': '反选',
    } as Record<string, string>,

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
    initGit: '初始化 Git 仓库',
    initGitSkipped: 'Git 不可用，已跳过',

    linkFailed: '创建 Symlink 授权失败，请在授权弹框选择 "是" 以继续：',
    linkRetry: '重 试',
    linkJunction: '改为创建 Junction（不推荐）',

    // Example System
    example: {
        creatingFrom: (sourceType: string, name: string) => `正在从${chalk.cyan(sourceType)}创建项目：${chalk.green(name)}\n`,
        downloading: '下载示例',
        downloadFailed: (error: string) => `下载示例失败：${error}`,
        verifying: '验证示例结构',
        verifyError: (error: string) => `验证错误：${error}`,
        copying: (dir: string) => `复制文件到 "${dir}"`,
        copyFailed: (error: string) => `复制文件失败：${error}`,
        settingUpSymlink: '设置符号链接',
        symlinkFailed: '创建符号链接失败，您可能需要手动设置',
        installFailed: '部分 npm 包安装失败',
        createSuccess: chalk.green('✅ 从示例创建项目成功。\n'),
        createSuccessWithProblems: chalk.yellow('🟨 项目已创建，但存在以下问题：\n'),
        notFound: (name: string) => `未找到示例：${chalk.yellow(name)}`,
        invalidExample: '这不是一个有效的 TSRPC 示例（缺少 example.json）',
        missingMetadata: '警告：未找到 example.json，使用默认设置',

        // List examples
        listTitle: '可用示例\n',
        officialSection: chalk.bold.green('📦 官方示例'),
        communitySection: chalk.bold.blue('🌍 社区示例'),
        noExamples: '暂无可用示例',
        difficulty: {
            beginner: '初级',
            intermediate: '中级',
            advanced: '高级'
        },
        tags: '标签',
        usage: `\n使用方法：${chalk.cyan('npx create-tsrpc-app my-app --example <名称>')}\n`,

        // Interactive mode
        askUseExample: '是否要从示例项目开始？',
        selectExample: '选择一个示例：',
        startFromExample: '从示例开始',
        startFromScratch: '从头开始（空白模板）',

        // Registry
        refreshingRegistry: '正在刷新示例注册表...',
        registryRefreshed: '注册表刷新成功',

        // Cache
        clearingCache: '正在清除所有缓存的示例...',
        cacheCleared: '缓存清除成功',

        // Security
        communityWarning: chalk.yellow('⚠️  这是一个社区示例，尚未经过维护者验证。\n   请在生产环境使用前审查代码。'),
        verifiedBadge: chalk.green('✓ 已验证'),

        // Error messages
        networkTimeout: '网络超时。请检查网络连接后重试。',
        rateLimitExceeded: 'GitHub API 请求频率超限。请稍后重试。',
        repoNotAccessible: (repo: string) => `无法访问仓库：${chalk.yellow(repo)}。可能是私有仓库或不存在。`,

        // Success next steps
        nextSteps: '下一步：',
        cdIntoProject: (dir: string) => `  cd ${chalk.cyan(dir)}`,
        installDeps: '  npm install',
        startDev: '  npm run dev'
    }
}