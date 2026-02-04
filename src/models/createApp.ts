import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs-extra";
import ncu from "npm-check-updates";
import path from "path";
import { i18n } from "../i18n/i18n";
import { AIEditor, CreateOptions } from "./CreateOptions";
import { ensureSymlinks } from "./ensureSymlinks";
import { getInstallEnv, npmInstall } from "./npmInstall";
import { spinner } from "./spinner";

const tplDir = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, './templates') : path.resolve(__dirname, '../../dist/templates');
let totalStep = 0;

const SCREEN_WIDTH = 40;

export async function createApp(options: CreateOptions) {
    spinner.text = '';
    spinner.color = 'yellow';

    // 计算步骤数量 后端4 前端5 NPM1 AI Friendly1 Git1
    const hasAIFriendly = options.features.indexOf('ai-friendly') > -1 && options.client !== 'none';
    totalStep = 5 + (options.client === 'none' ? 0 : 4) + (hasAIFriendly ? 1 : 0) + 1; // +1 for git init

    // 判断安装环境
    doing(i18n.checkNpmEnv);
    let installEnv = await getInstallEnv();
    done(true, `${i18n.checkNpmEnv}: `
        + chalk.cyan('Command: ')
        + chalk.yellow.bold(installEnv.pkgManager)
        + (installEnv.registry ? (chalk.cyan(', Registry: ') + chalk.yellow(installEnv.registry)) : ''));

    // 创建项目
    let server = await createServer(options, installEnv.registry);
    let client: { clientDir: string, clientDirName: string } | undefined;
    if (options.client !== 'none') {
        client = await createBrowserClient(options, installEnv.registry);

        // Sync 演示代码
        if (options.features.indexOf('symlink') > -1) {
            doing('Initialize symlink');
            await ensureSymlinks([{
                src: path.join(server.serverDir, 'src/shared'),
                dst: path.join(client.clientDir, 'src/shared')
            }])
        }
        else {
            doing('Sync shared directory');
            await fs.copy(path.join(server.serverDir, 'src/shared'), path.join(client.clientDir, 'src/shared'), { recursive: true })
        }
        done();

        // AI Friendly (Claude Code Skills)
        if (options.features.indexOf('ai-friendly') > -1) {
            await setupAIFriendly(options.projectDir, options);
        }
    }

    // 安装依赖
    let npmResServer = false;
    let npmResClient = !client;
    doing(i18n.npmInstall, i18n.mayLongPleaseWait);
    [npmResServer, npmResClient] = await Promise.all([
        npmInstall(installEnv.cmd, server.serverDir),
        client ? npmInstall(installEnv.cmd, client.clientDir) : true
    ])
    done(npmResServer && npmResClient);

    // 初始化 Git 仓库
    await initGit(options.projectDir);

    console.log(chalk.green(`\n${'='.repeat(SCREEN_WIDTH)}\n`));

    const serverEnd = server.serverDirName === 'server' ? i18n.server : i18n.backend;
    const clientEnd = client?.clientDirName === 'client' ? i18n.client : i18n.frontend;

    if (npmResServer && npmResClient) {
        console.log(i18n.createAppSucc);
    }
    else {
        console.log(i18n.createAppSuccWithProblems);
        if (!npmResServer) {
            console.log(i18n.npmInstallFailed(serverEnd, path.relative('.', server.serverDir), installEnv.pureCmd));
        }
        if (!npmResClient && client) {
            console.log(i18n.npmInstallFailed(clientEnd, path.relative('.', client.clientDir), installEnv.pureCmd));
        }
    }

    // Run local dev server:
    console.log(i18n.runLocalServer);
    if (client) {
        console.log(`= ${serverEnd} =\n`)
        console.log(chalk.cyan(`    cd ${path.relative('.', server.serverDir)}\n    npm run dev\n`));
        console.log(`= ${clientEnd} =\n`)
        console.log(chalk.cyan(`    cd ${path.relative('.', client.clientDir)}\n    npm run dev\n`));
    }
    else {
        let cdPath = path.relative('.', server.serverDir);
        if (cdPath) {
            console.log(chalk.cyan(`    cd ${cdPath}`));
        }
        console.log(chalk.cyan(`    npm run dev\n`));
    }

    spinner.text = '';
    spinner.stop();
}

async function createServer(options: CreateOptions, registry: string | undefined) {
    // 配置
    const serverDirName = options.client === 'none' ? '.' : options.client === 'node' ? 'server' : 'backend';
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const serverDir = path.resolve(options.projectDir, serverDirName);
    const appName = path.basename(path.resolve(options.projectDir));

    // 创建项目目录
    await fs.ensureDir(options.projectDir);

    // 复制文件
    doing(i18n.copyFiles(serverDirName))
    await fs.ensureDir(serverDir);
    // 如果不需要单元测试，忽略 vitest.config.ts
    const ignoreFiles = options.features.indexOf('unitTest') === -1 ? ['vitest.config.ts'] : undefined;
    await copyRootFiles(path.join(tplDir, 'server'), serverDir, ignoreFiles);
    await copyTypeFolder('src', options.server, path.join(tplDir, 'server'), serverDir);
    await fs.copy(path.join(tplDir, 'server', '.vscode'), path.join(serverDir, '.vscode'), { recursive: true });

    // 纯后端 注释 sync 部分
    if (options.client === 'none') {
        let configContent = await fs.readFile(path.join(serverDir, 'tsrpc.config.ts'), 'utf-8');
        configContent = configContent.replace(/(sync:\s+\[\n)([\s\S]+)(\],)/, (_, p1: string, p2: string, p3: string) => {
            return p1 + p2.split('\n').map(v => v.replace(/^\s{8}/, '        // ')).join('\n') + p3;
        });
        await fs.writeFile(path.join(serverDir, 'tsrpc.config.ts'), configContent, 'utf-8');
    }

    // 单元测试
    if (options.features.indexOf('unitTest') > -1) {
        await copyTypeFolder('test', options.server, path.join(tplDir, 'server'), serverDir);
    }
    else {
        let content = await fs.readFile(path.join(serverDir, 'README.md'), 'utf-8');
        content = content.replace(/### Unit Test[\s\S]+npm run test\s*```/, '');
        await fs.writeFile(path.join(serverDir, 'README.md'), content, 'utf-8');
    }

    done();

    // 写入 package.json
    doing(i18n.genPackageJson(serverDirName))
    let packageJson = JSON.parse(await fs.readFile(path.join(serverDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${serverDirName}`;
    // 单元测试特性
    if (options.features.indexOf('unitTest') === -1) {
        delete packageJson.scripts.test;
        delete packageJson.scripts['test:watch'];
        delete packageJson.devDependencies.vitest;
    }
    // ESLint
    if (options.features.indexOf('eslint') > -1) {
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies['eslint'] = '^9.0.0';
        packageJson.devDependencies['@eslint/js'] = '^9.0.0';
        packageJson.devDependencies['typescript-eslint'] = '^8.0.0';
        packageJson.devDependencies['globals'] = '^15.0.0';
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts['lint'] = 'eslint src/';
    }
    await fs.writeFile(path.join(serverDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    done();

    // ESLint 配置文件
    if (options.features.indexOf('eslint') > -1) {
        await setupESLint(serverDir, 'server');
    }

    // 安装依赖
    doing(`npm-check-update`)
    let resNcu = await ncu.run({
        packageFile: path.join(serverDir, 'package.json'),
        upgrade: true,
        target: 'minor',
        registry: registry
    }).then(() => true).catch(() => false);
    done(resNcu);

    return {
        serverDir: serverDir,
        serverDirName: serverDirName
    };
}

async function createBrowserClient(options: CreateOptions, registry: string | undefined) {
    // 开始创建前端应用
    const clientDirName = options.client === 'node' ? 'client' : 'frontend';
    const clientDir = path.resolve(options.projectDir, clientDirName);
    const appName = path.basename(path.resolve(options.projectDir));
    const useTailwind = options.features.indexOf('tailwind') > -1;
    const tplClientDir = path.join(tplDir, `client-${options.client}`);

    // 复制文件
    doing(i18n.copyFiles(clientDirName))
    await fs.ensureDir(clientDir);
    
    // 复制根目录文件，忽略 index-http.html 和 index-ws.html
    await copyRootFiles(tplClientDir, clientDir, ['index-http.html', 'index-ws.html']);
    
    // 处理 index.html（Vite 需要在根目录）
    // 优先使用 index-{type}.html，否则使用通用的 index.html
    const typedIndexPath = path.join(tplClientDir, `index-${options.server}.html`);
    const genericIndexPath = path.join(tplClientDir, 'index.html');
    if (await fs.pathExists(typedIndexPath)) {
        await fs.copyFile(typedIndexPath, path.join(clientDir, 'index.html'));
    } else if (await fs.pathExists(genericIndexPath)) {
        await fs.copyFile(genericIndexPath, path.join(clientDir, 'index.html'));
    }
    
    await copyTypeFolder('src', options.server, tplClientDir, clientDir);
    await copyTypeFolder('public', options.server, tplClientDir, clientDir);
    
    // Vue 额外复制 vetur.config.js
    if (options.client.startsWith('vue')) {
        await fs.copyFile(path.join(tplDir, 'vetur.config.js'), path.resolve(options.projectDir, 'vetur.config.js'));
    }
    done();

    // 写入 package.json
    doing(i18n.genPackageJson(clientDirName))
    let packageJson = JSON.parse(await fs.readFile(path.join(clientDir, 'package.json'), 'utf-8'));
    packageJson.name = `${appName}-${clientDirName}`;

    // Tailwind CSS v4
    if (useTailwind) {
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies['tailwindcss'] = '^4.0.0';
        packageJson.devDependencies['@tailwindcss/vite'] = '^4.0.0';
    }

    // ESLint
    const useESLint = options.features.indexOf('eslint') > -1;
    if (useESLint) {
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies['eslint'] = '^9.0.0';
        packageJson.devDependencies['@eslint/js'] = '^9.0.0';
        packageJson.devDependencies['typescript-eslint'] = '^8.0.0';
        packageJson.devDependencies['globals'] = '^15.0.0';
        if (options.client === 'react') {
            packageJson.devDependencies['eslint-plugin-react-hooks'] = '^5.0.0';
            packageJson.devDependencies['eslint-plugin-react-refresh'] = '^0.4.0';
        } else if (options.client === 'vue3') {
            packageJson.devDependencies['eslint-plugin-vue'] = '^9.0.0';
        }
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts['lint'] = 'eslint src/';
    }

    await fs.writeFile(path.join(clientDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    done();

    // Tailwind 配置文件
    if (useTailwind) {
        await setupTailwind(clientDir);
    }

    // ESLint 配置文件
    if (useESLint) {
        await setupESLint(clientDir, options.client as 'browser' | 'react' | 'vue3');
    }

    // 安装依赖
    doing('npm-check-update')
    let resNcu = await ncu.run({
        packageFile: path.join(clientDir, 'package.json'),
        upgrade: true,
        target: 'minor',
        registry: registry
    }).then(() => true).catch(() => false);
    done(resNcu);

    return {
        clientDir: clientDir,
        clientDirName: clientDirName
    }
}

async function setupTailwind(clientDir: string) {
    // Tailwind CSS v4 使用 Vite 插件，不需要 tailwind.config.js 和 postcss.config.js

    // 更新 vite.config.ts 添加 @tailwindcss/vite 插件
    const viteConfigPath = path.join(clientDir, 'vite.config.ts');
    if (await fs.pathExists(viteConfigPath)) {
        let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');

        // 添加 tailwindcss import
        if (!viteConfig.includes('@tailwindcss/vite')) {
            // 在第一个 import 之前添加 tailwindcss import
            viteConfig = `import tailwindcss from '@tailwindcss/vite'\n` + viteConfig;

            // 检查是否已有 plugins 数组
            if (viteConfig.includes('plugins:')) {
                // 在 plugins 数组中添加 tailwindcss()
                viteConfig = viteConfig.replace(
                    /plugins:\s*\[/,
                    'plugins: [\n    tailwindcss(),'
                );
            } else {
                // 没有 plugins，在 defineConfig({ 后添加
                viteConfig = viteConfig.replace(
                    /defineConfig\(\{/,
                    'defineConfig({\n  plugins: [tailwindcss()],'
                );
            }

            await fs.writeFile(viteConfigPath, viteConfig, 'utf-8');
        }
    }

    // 更新 CSS 文件使用 Tailwind v4 语法
    const cssPath = path.join(clientDir, 'src/index.css');
    if (await fs.pathExists(cssPath)) {
        let cssContent = await fs.readFile(cssPath, 'utf-8');
        const tailwindImport = `@import "tailwindcss";

`;
        cssContent = tailwindImport + cssContent;
        await fs.writeFile(cssPath, cssContent, 'utf-8');
    }
}

async function setupESLint(targetDir: string, platform: 'server' | 'browser' | 'react' | 'vue3') {
    const configPath = path.join(targetDir, 'eslint.config.mjs');
    let config: string;

    switch (platform) {
        case 'server':
            config = `import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
);
`;
            break;
        case 'react':
            config = `import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
    { ignores: ["dist/"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    },
);
`;
            break;
        case 'vue3':
            config = `import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config(
    { ignores: ["dist/"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs["flat/essential"],
    {
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ["**/*.vue"],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
);
`;
            break;
        default:
            config = `import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist/"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: globals.browser,
        },
    },
);
`;
            break;
    }

    await fs.writeFile(configPath, config, 'utf-8');

    // 更新 .vscode/settings.json 添加 eslint.useFlatConfig
    const vscodeDir = path.join(targetDir, '.vscode');
    const settingsPath = path.join(vscodeDir, 'settings.json');
    if (await fs.pathExists(settingsPath)) {
        const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        settings['eslint.useFlatConfig'] = true;
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), 'utf-8');
    }
}

async function copyRootFiles(fromDir: string, toDir: string, ignores?: string[]) {
    let dirs = await fs.readdir(fromDir);
    for (let v of dirs) {
        // ignores
        if (ignores?.includes(v)) {
            continue;
        }
        if ((await fs.stat(path.join(fromDir, v))).isFile()) {
            await fs.copyFile(path.join(fromDir, v), path.join(toDir, v.endsWith('__CTA') ? v.substr(0, v.length - 5) : v));
        }
    }
}

async function copyTypeFolder(folderName: string, type: string, fromDir: string, toDir: string) {
    if (await fs.pathExists(path.join(fromDir, `${folderName}-${type}`))) {
        await fs.copy(path.join(fromDir, `${folderName}-${type}`), path.join(toDir, folderName), { recursive: true });
    }
    else if (await fs.pathExists(path.join(fromDir, folderName))) {
        await fs.copy(path.join(fromDir, folderName), path.join(toDir, folderName), { recursive: true });
    }
    // 如果两者都不存在，则跳过（例如某些模板可能没有 public 目录）
}

let currentDoingText: string | undefined;
let finishedStep = 0;
export function doing(text: string, doingPostFix: string = '...') {
    if (currentDoingText) {
        return;
    }
    currentDoingText = text;
    spinner.prefixText = chalk.yellow(` → ${++finishedStep}/${totalStep} ${text}${doingPostFix}`);
    spinner.start();
}
export function done(succ: boolean = true, text?: string) {
    spinner.prefixText = '';
    if (currentDoingText) {
        text = `${finishedStep}/${totalStep} ${text ?? currentDoingText}`
        succ ? spinner.succeed(chalk.green(text)) : spinner.fail(chalk.red(text));
        currentDoingText = undefined;
    }
}

interface EditorConfig {
    outputDir: string;
    fileExtension: string;
    fileName?: string;
    wrapInFolder?: boolean;
    skills?: Record<string, {
        content: string;
        examples?: string[];
        frontmatter: Record<string, any>;
    }>;
    mergeContent?: string[];
    rootFile?: {
        name: string;
        outputDir: string;
    };
    frontmatter?: Record<string, any>;
}

async function setupAIFriendly(projectDir: string, options: CreateOptions) {
    doing('Setup AI Friendly (Multi-Editor Rules)');

    const aiFeaturesTplDir = path.join(tplDir, 'ai-features');
    const contentDir = path.join(aiFeaturesTplDir, 'content');
    const configPath = path.join(aiFeaturesTplDir, 'editor-configs.json');
    const appName = path.basename(path.resolve(projectDir));

    // Determine frontend type for placeholders
    let frontendType = 'Vanilla JS';
    if (options.client === 'react') frontendType = 'React';
    else if (options.client === 'vue3') frontendType = 'Vue 3';

    // Read editor configurations
    const editorConfigs: Record<string, EditorConfig> = JSON.parse(
        await fs.readFile(configPath, 'utf-8')
    );

    // Read core content files
    const contents: Record<string, string> = {};
    const contentFiles = await fs.readdir(contentDir);
    for (const file of contentFiles) {
        const filePath = path.join(contentDir, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile() && file.endsWith('.md')) {
            const name = file.replace('.md', '');
            contents[name] = await fs.readFile(filePath, 'utf-8');
        }
    }

    // Read example files
    const examplesDir = path.join(contentDir, 'examples');
    const examples: Record<string, string> = {};
    if (await fs.pathExists(examplesDir)) {
        const exampleFiles = await fs.readdir(examplesDir);
        for (const file of exampleFiles) {
            if (file.endsWith('.md')) {
                const name = file.replace('.md', '');
                examples[name] = await fs.readFile(path.join(examplesDir, file), 'utf-8');
            }
        }
    }

    // Generate rules for each editor (filtered by user selection)
    for (const [editor, config] of Object.entries(editorConfigs)) {
        // Skip if user selected specific editors and this one isn't included
        if (options.aiEditors && options.aiEditors.length > 0 && !options.aiEditors.includes(editor as AIEditor)) {
            continue;
        }
        await generateEditorRules(projectDir, editor, config, contents, examples);
    }

    // Copy and customize CLAUDE.md (for Claude Code) - only if claude is selected
    if (!options.aiEditors || options.aiEditors.length === 0 || options.aiEditors.includes('claude')) {
        const claudeMdSrc = path.join(aiFeaturesTplDir, 'CLAUDE.md');
        const claudeMdDst = path.join(projectDir, 'CLAUDE.md');
        if (await fs.pathExists(claudeMdSrc)) {
            let content = await fs.readFile(claudeMdSrc, 'utf-8');
            content = content.replace(/\{\{PROJECT_NAME\}\}/g, appName);
            content = content.replace(/\{\{FRONTEND_TYPE\}\}/g, frontendType);
            content = content.replace(/\{\{RECOMMENDED_SKILLS\}\}/g, getRecommendedSkills(options.client));
            await fs.writeFile(claudeMdDst, content, 'utf-8');
        }
    }

    done();
}

function generateFrontmatter(frontmatter: Record<string, any>): string {
    const lines: string[] = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
        if (typeof value === 'boolean') {
            lines.push(`${key}: ${value}`);
        } else if (typeof value === 'string') {
            // Check if value needs quoting
            if (value.includes(':') || value.includes('"') || value.includes('\n')) {
                lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
            } else {
                lines.push(`${key}: ${value}`);
            }
        } else if (Array.isArray(value)) {
            lines.push(`${key}: ${JSON.stringify(value)}`);
        } else {
            lines.push(`${key}: ${JSON.stringify(value)}`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}

async function generateEditorRules(
    projectDir: string,
    editor: string,
    config: EditorConfig,
    contents: Record<string, string>,
    examples: Record<string, string>
) {
    const outputDir = path.join(projectDir, config.outputDir);
    await fs.ensureDir(outputDir);

    if (config.skills) {
        // Generate separate skill folders (Claude Code, TRAE, etc.)
        for (const [skillName, skillConfig] of Object.entries(config.skills)) {
            const skillDir = path.join(outputDir, skillName);
            await fs.ensureDir(skillDir);

            // Generate SKILL.md with frontmatter
            const frontmatter = generateFrontmatter(skillConfig.frontmatter);
            const content = contents[skillConfig.content] || '';
            const skillContent = `${frontmatter}\n\n${content}`;
            await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');

            // Copy examples if specified
            if (skillConfig.examples && skillConfig.examples.length > 0) {
                const examplesDir = path.join(skillDir, 'examples');
                await fs.ensureDir(examplesDir);
                for (const exampleName of skillConfig.examples) {
                    if (examples[exampleName]) {
                        await fs.writeFile(
                            path.join(examplesDir, `${exampleName}.md`),
                            examples[exampleName],
                            'utf-8'
                        );
                    }
                }
            }
        }
    } else {
        // Other editors: Generate single merged file
        const mergeContentNames = config.mergeContent || [];
        let mergedContent = '';

        for (const contentName of mergeContentNames) {
            if (contents[contentName]) {
                mergedContent += contents[contentName] + '\n\n';
            }
        }

        // Generate file with frontmatter
        const frontmatter = config.frontmatter ? generateFrontmatter(config.frontmatter) : '';
        const fileName = config.fileName || 'rules';
        const fileContent = frontmatter ? `${frontmatter}\n\n${mergedContent.trim()}` : mergedContent.trim();

        await fs.writeFile(
            path.join(outputDir, `${fileName}${config.fileExtension}`),
            fileContent,
            'utf-8'
        );

        // Generate root file for OpenCode (AGENTS.md)
        if (config.rootFile) {
            const rootOutputDir = path.join(projectDir, config.rootFile.outputDir);
            await fs.ensureDir(rootOutputDir);
            // Generate a simplified version for AGENTS.md
            await fs.writeFile(
                path.join(rootOutputDir, config.rootFile.name),
                generateAgentsContent(mergedContent),
                'utf-8'
            );
        }
    }
}

function generateAgentsContent(content: string): string {
    // Generate a simplified AGENTS.md content from the full guide
    return `# TSRPC Project Agent Instructions

This is a full-stack TypeScript project using TSRPC framework for type-safe RPC communication.

## Project Structure

- \`backend/src/api/\` - API implementations (Api*.ts)
- \`backend/src/shared/protocols/\` - Protocol definitions (Pt*.ts)
- \`frontend/src/shared/\` - Symlink to backend shared code

## Creating a New API

1. **Define Protocol** in \`backend/src/shared/protocols/Pt{Name}.ts\`:
   - Request interface: \`Req{Name}\`
   - Response interface: \`Res{Name}\`

2. **Implement API** in \`backend/src/api/Api{Name}.ts\`:
   - Use \`call.succ({...})\` for success
   - Use \`call.error("message")\` for errors
   - Access request via \`call.req\`

3. **Regenerate Protocol**: \`cd backend && npm run proto\`

## Code Patterns

\`\`\`typescript
// API Implementation
export async function ApiExample(call: ApiCall<ReqExample, ResExample>) {
    call.succ({ result: "value" });
}

// Client Call
const result = await client.callApi("Example", { param: "value" });
if (result.isSucc) console.log(result.res);
\`\`\`

## Key Commands

- \`npm run dev\` - Start development servers
- \`cd backend && npm run proto\` - Regenerate protocol after changes

## Type Safety

TSRPC automatically validates requests against TypeScript types at runtime.
`;
}

async function initGit(projectDir: string) {
    doing(i18n.initGit);
    try {
        execSync('git init', { cwd: projectDir, stdio: 'ignore' });
        // Create initial .gitignore if not exists
        const gitignorePath = path.join(projectDir, '.gitignore');
        if (!await fs.pathExists(gitignorePath)) {
            await fs.writeFile(gitignorePath, `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`, 'utf-8');
        }
        // Create initial commit
        execSync('git add -A', { cwd: projectDir, stdio: 'ignore' });
        execSync('git commit -m "Initial commit from create-tsrpc-app"', { cwd: projectDir, stdio: 'ignore' });
        done(true);
    } catch (e) {
        // git not available, silently skip
        done(false, i18n.initGitSkipped);
    }
}

function getRecommendedSkills(client: CreateOptions['client']): string {
    const skills: string[] = [];

    if (client === 'react') {
        skills.push('- [vercel-react-best-practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) - React/Next.js performance optimization');
    } else if (client === 'vue3') {
        skills.push('- [vue-best-practices](https://skills.sh/hyf0/vue-skills/vue-best-practices) - Vue.js best practices');
    }

    if (skills.length === 0) {
        return '\n_No framework-specific skills recommended for this project type._\n';
    }

    return '\n' + skills.join('\n') + '\n';
}