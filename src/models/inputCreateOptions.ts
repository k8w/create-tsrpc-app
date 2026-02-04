import chalk from "chalk";
import fs from "fs";
import { input, select, checkbox, confirm, Separator } from "@inquirer/prompts";
import path from "path";
import { createFromExample } from "../example/createFromExample";
import { getAllExamples } from "../example/ExampleRegistry";
import { parseExampleArg } from "../example/ExampleResolver";
import { LocalizedString, RegistryExample, CommunityExample } from "../example/ExampleOptions";
import { i18n, isZhCN } from "../i18n/i18n";
import { AIEditor, clientFeatures, commonFeatures, CreateOptions, serverFeatures } from "./CreateOptions";
import { VERSION } from "./version";

/**
 * Get localized string value
 */
function getLocalizedValue(str: LocalizedString | string | undefined): string {
    if (!str) return '';
    if (typeof str === 'string') return str;
    return isZhCN ? str['zh-CN'] : str['en-US'];
}

export interface InputCreateOptionsExt extends Partial<CreateOptions> {
    /** Force show example selection (--from-example) */
    fromExample?: boolean;
    /** Skip example selection (--no-example) */
    noExample?: boolean;
}

export async function inputCreateOptions(options: InputCreateOptionsExt): Promise<CreateOptions> {
    console.clear();
    console.log(i18n.welcome(VERSION));

    let projectDir: string;
    if (options.projectDir) {
        projectDir = options.projectDir;
        console.log(i18n.createApp(path.basename(path.resolve(projectDir))));
    }
    // 请输入要创建的项目目录名
    else {
        projectDir = await input({
            message: i18n.inputProjectDir,
            validate: (v: string) => !!v || ' ',
        });
    }

    // 目标文件夹不为空，要以覆盖模式继续吗？
    let dir = fs.existsSync(projectDir) && fs.statSync(projectDir).isDirectory() && fs.readdirSync(projectDir);
    if (dir && dir.filter(v=>!v.startsWith('.')).length) {
        console.log(chalk.cyan(`\n${path.resolve(projectDir)}\n${dir.map(v => chalk.yellow('  |- ' + v)).join('\n')}\n`));
        if (!await confirm({
            message: i18n.dirNotEmpty,
            default: false,
        })) {
            console.log(i18n.canceled);
            process.exit();
        }
    }

    // TODO: Enable example selection in v4.0
    // Check if user wants to start from example
    // --from-example: force show example selection
    // --no-example: skip example selection
    // default: show example selection only when no preset is used
    // const shouldShowExampleSelection = options.fromExample ||
    //     (!options.noExample && !options.client && !options.server);
    //
    // if (shouldShowExampleSelection) {
    //     const selectedExample = await selectExampleOrScratch(projectDir, options.fromExample);
    //     if (selectedExample) {
    //         // User selected an example, create from it and exit
    //         // This will throw if failed
    //         return selectedExample as any; // Return special marker
    //     }
    //     // User chose "from scratch", continue with normal flow
    // }

    // client
    // 请选择要创建的项目类型
    let client = options.client ?? await select({
        message: i18n.selectProjectType,
        choices: [
            new Separator('\n' + i18n.projectCategory.browser + '\n'),
            { name: i18n.projectType.react, value: 'react' as const },
            { name: i18n.projectType.vue3, value: 'vue3' as const },
            { name: i18n.projectType.nativeBrowser, value: 'browser' as const },
            new Separator('\n' + i18n.projectCategory.server + '\n'),
            { name: i18n.projectType.server, value: 'none' as const }
        ],
        pageSize: 12,
    }) as CreateOptions['client'];

    // server
    let server = options.server ?? await select({
        message: i18n.selectServerType,
        choices: [
            { name: i18n.httpShortService, value: 'http' as const },
            { name: i18n.wsLongService, value: 'ws' as const }
        ],
        pageSize: 12,
    }) as CreateOptions['server'];

    // features
    let features: CreateOptions['features'] = options.features || [];
    let platformClientFeatures = clientFeatures.filter(v => v.platforms.indexOf(client) > -1);
    let featureChoices = [...platformClientFeatures, ...commonFeatures, ...serverFeatures];

    const checkboxTheme = {
        style: {
            help: (text: string) => {
                let result = text;
                for (const [en, localized] of Object.entries(i18n.checkboxKeys)) {
                    result = result.replace(en, localized);
                }
                return chalk.dim(result);
            }
        }
    };

    if (featureChoices.length) {
        features = options.features ?? await checkbox({
            message: i18n.selectFeatures,
            choices: featureChoices,
            pageSize: 20,
            theme: checkboxTheme,
        });
    }

    // Always include symlink and unitTest
    if (!features.includes('symlink')) {
        features.push('symlink');
    }
    if (!features.includes('unitTest')) {
        features.push('unitTest');
    }

    // AI Editor selection when ai-friendly is enabled (skip if already provided via preset)
    let aiEditors: AIEditor[] | undefined = options.aiEditors;
    if (features.includes('ai-friendly') && !aiEditors) {
        aiEditors = await checkbox({
            message: i18n.selectAIEditors,
            choices: [
                { name: i18n.aiEditors.claude, value: 'claude' as const, checked: true },
                { name: i18n.aiEditors.cursor, value: 'cursor' as const, checked: false },
                { name: i18n.aiEditors.opencode, value: 'opencode' as const, checked: false },
                { name: i18n.aiEditors.trae, value: 'trae' as const, checked: false }
            ],
            pageSize: 10,
            theme: checkboxTheme,
        });
    }

    return {
        projectDir: projectDir,
        server: server,
        client: client,
        features: features,
        aiEditors: aiEditors
    };
}

export function getProjectName(projectDir: string) {
    return path.basename(path.resolve(projectDir));
}

/**
 * Ask user whether to start from example, then show example selection if yes
 * @param projectDir - Target project directory
 * @param forceExample - If true, skip the yes/no question (--from-example flag)
 * Returns CreateOptions marker if example was created, or null to continue with template
 */
async function selectExampleOrScratch(projectDir: string, forceExample?: boolean): Promise<CreateOptions | null> {
    // Fetch available examples
    const { official, community } = await getAllExamples();
    const hasExamples = official.length > 0 || community.length > 0;

    if (!hasExamples) {
        if (forceExample) {
            // --from-example was used but no examples available
            console.log(chalk.yellow(i18n.example.noExamples));
            process.exit(1);
        }
        // No examples available, skip this step
        return null;
    }

    // Step 1: Ask if user wants to start from example (unless --from-example is used)
    if (!forceExample) {
        const wantExample = await select({
            message: i18n.example.askUseExample,
            choices: [
                { name: i18n.example.startFromScratch, value: false },
                { name: i18n.example.startFromExample, value: true }
            ],
        });

        if (!wantExample) {
            // User chose not to use example, continue with template
            return null;
        }
    }

    // Step 2: Show example selection list
    const choices: any[] = [];

    // Add official examples
    if (official.length > 0) {
        choices.push(new Separator(chalk.green('  ' + i18n.example.officialSection)));
        for (const example of official) {
            const displayName = getLocalizedValue(example.displayName);
            const versionTag = chalk.blue(`[${example.tsrpcVersion}]`);
            choices.push({
                name: `  ${chalk.cyan(example.name)} ${versionTag} - ${displayName}`,
                value: example.name
            });
        }
    }

    // Add community examples
    if (community.length > 0) {
        choices.push(new Separator(''));
        choices.push(new Separator(chalk.blue('  ' + i18n.example.communitySection)));
        for (const example of community) {
            const displayName = example.description
                ? getLocalizedValue(example.description)
                : example.repo;
            const versionTag = chalk.blue(`[${example.tsrpcVersion}]`);
            choices.push({
                name: `  ${chalk.cyan(example.name)} ${versionTag} - ${displayName}`,
                value: example.name
            });
        }
    }

    // Prompt user to select example
    const choice = await select<string>({
        message: i18n.example.selectExample,
        choices: choices,
        pageSize: 15,
    });

    // User selected an example, create from it
    const { official: officialExamples, community: communityExamples } = await getAllExamples();
    const exampleSource = parseExampleArg(choice,
        { version: 1, repository: 'k8w/create-tsrpc-app', examples: officialExamples },
        { version: 1, examples: communityExamples }
    );

    const result = await createFromExample({
        projectDir,
        exampleSource
    });

    if (!result.success) {
        throw new Error(result.errors?.join('\n') || 'Failed to create from example');
    }

    // Return a special marker to indicate we're done
    // The caller should check for this and exit early
    return { __fromExample: true } as any;
}