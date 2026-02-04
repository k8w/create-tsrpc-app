import chalk from "chalk";

export const i18nEnUs = {
    help: `
${chalk.bold(chalk.green('create-tsrpc-app ') + chalk.yellow('<project-dir>')) + ' [options]'}

Options:
    -h, --help                  Output help information
    -v, --version               Output version number
    -p, --preset <presetName>   Use preset (skip interactive configuration)
                                Preset: ${chalk.cyan('browser, react, vue3, server')}
    -e, --example <name>        Create project from example
                                ${chalk.gray('Official:')} ${chalk.cyan('ecommerce-admin')}
                                ${chalk.gray('GitHub:')} ${chalk.cyan('user/repo')} or ${chalk.cyan('user/repo#branch')}
    --from-example              Start with example selection ${chalk.gray('(for CI/scripts)')}
    --no-example                Skip example selection ${chalk.gray('(for CI/scripts)')}
    --list-examples             List all available examples
    --refresh-registry          Force refresh the examples registry cache
    --clear-cache               Clear all cached examples and registry
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
    presetNotExist: (preset: string) => `Preset not exists：${chalk.yellow(preset)}`,

    // Input Create Options
    inputProjectDir: 'Input project directory name: ',
    dirNotEmpty: `The target directory is not empty, continue and ${chalk.yellow('overwrite')} it ?`,

    selectProjectType: 'Please select the project type: ',
    projectType: {
        react: 'React + backend',
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

    selectFeatures: 'Select additional features: ',
    featureAIFriendly: 'AI Ready (AI Skills, Rules...)',
    setupAIFriendly: 'Setup AI Ready (Multi-Editor Rules)',
    selectAIEditors: 'Select AI editors to support: ',
    aiEditors: {
        claude: 'Claude Code (.claude/skills + CLAUDE.md)',
        cursor: 'Cursor (uses Claude Code config)',
        opencode: 'OpenCode (.opencode/rules + AGENTS.md)',
        trae: 'TRAE (.trae/skills)'
    },
    checkboxKeys: {
        'toggle': 'toggle',
        'select all': 'select all',
        'invert selection': 'invert',
    } as Record<string, string>,

    // CreateApp
    checkNpmEnv: 'Check NPM environment',
    npmInstall: `Install NPM dependencies`,
    mayLongPleaseWait: '(May take a while, please wait)...',
    createApp: (appName: string) => `Create TSRPC APP: ${chalk.green(appName)}`,
    createAppSucc: chalk.green('✅ TSRPC APP created successfully.\n'),
    createAppSuccWithProblems: chalk.yellow('🟨 TSRPC APP created, but with problems：\n'),
    npmInstallFailed: (endName: string, dirName: string, pureCmd: string) => chalk.red(`❌ "${pureCmd}" failed at ${endName}, you can re-execute it mannually. ` +
        `\n\n    cd ${dirName}\n    ${pureCmd}\n`),
    runLocalServer: 'Run local dev server:\n',
    copyFiles: (dirName: string) => `Copy files to "${dirName}"`,
    genPackageJson: (dirName: string) => `Generate "${dirName}/package.json"`,
    initGit: 'Initialize Git repository',
    initGitSkipped: 'Git not available, skipped',

    linkFailed: 'Authorization to create Symlink failed. Please select "Yes" in the authorization dialog: ',
    linkRetry: 'Retry',
    linkJunction: 'Create Junction instead (Not recommended)',

    // Example System
    example: {
        creatingFrom: (sourceType: string, name: string) => `Creating project from ${chalk.cyan(sourceType)}: ${chalk.green(name)}\n`,
        downloading: 'Downloading example',
        downloadFailed: (error: string) => `Failed to download example: ${error}`,
        verifying: 'Verifying example structure',
        verifyError: (error: string) => `Verification error: ${error}`,
        copying: (dir: string) => `Copying files to "${dir}"`,
        copyFailed: (error: string) => `Failed to copy files: ${error}`,
        settingUpSymlink: 'Setting up symlink',
        symlinkFailed: 'Failed to create symlink, you may need to set it up manually',
        installFailed: 'Some npm packages failed to install',
        createSuccess: chalk.green('✅ Project created from example successfully.\n'),
        createSuccessWithProblems: chalk.yellow('🟨 Project created, but with some problems:\n'),
        notFound: (name: string) => `Example not found: ${chalk.yellow(name)}`,
        invalidExample: 'This is not a valid TSRPC example (missing example.json)',
        missingMetadata: 'Warning: example.json not found, using default settings',

        // List examples
        listTitle: 'Available Examples\n',
        officialSection: chalk.bold.green('📦 Official Examples'),
        communitySection: chalk.bold.blue('🌍 Community Examples'),
        noExamples: 'No examples available',
        difficulty: {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced'
        },
        tags: 'Tags',
        usage: `\nUsage: ${chalk.cyan('npx create-tsrpc-app my-app --example <name>')}\n`,

        // Interactive mode
        askUseExample: 'Would you like to start from an example project?',
        selectExample: 'Select an example:',
        startFromExample: 'Start from an example',
        startFromScratch: 'Start from scratch (empty template)',

        // Registry
        refreshingRegistry: 'Refreshing examples registry...',
        registryRefreshed: 'Registry refreshed successfully',

        // Cache
        clearingCache: 'Clearing all cached examples...',
        cacheCleared: 'Cache cleared successfully',

        // Security
        communityWarning: chalk.yellow('⚠️  This is a community example and has not been verified by the maintainers.\n   Please review the code before running in production.'),
        verifiedBadge: chalk.green('✓ Verified'),

        // Error messages
        networkTimeout: 'Network timeout. Please check your connection and try again.',
        rateLimitExceeded: 'GitHub API rate limit exceeded. Please wait a moment and try again.',
        repoNotAccessible: (repo: string) => `Repository not accessible: ${chalk.yellow(repo)}. It may be private or doesn't exist.`,

        // Success next steps
        nextSteps: 'Next steps:',
        cdIntoProject: (dir: string) => `  cd ${chalk.cyan(dir)}`,
        installDeps: '  npm install',
        startDev: '  npm run dev'
    }
}