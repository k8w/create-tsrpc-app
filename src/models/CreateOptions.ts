export type AIEditor = 'claude' | 'opencode' | 'trae'

export interface CreateOptions {
    projectDir: string
    server: 'http' | 'ws'
    client: ClientPlatform
    features: (ServerFeature | ClientFeature)[]
    aiEditors?: AIEditor[]  // Selected AI editors when ai-friendly is enabled
}

export type ClientPlatform = 'browser' | 'react' | 'vue3' | 'none' | 'node'

export type ServerFeature = 'unitTest'

export type ClientFeature = 'symlink' | 'tailwind' | 'ai-friendly'

export const serverFeatures: {
    name: string
    value: ServerFeature
    checked?: boolean
}[] = [
        // { name: '演示代码', value: 'demoCode', checked: true },
        // { name: i18n.featureUnitTest, value: 'unitTest' },
    ]

export const clientFeatures: {
    name: string
    value: ClientFeature
    checked?: boolean
    platforms: CreateOptions['client'][]
}[] = [
        {
            name: 'Tailwind CSS',
            value: 'tailwind',
            checked: true,
            platforms: ['browser', 'react', 'vue3'],
        },
        {
            name: 'AI Friendly (Claude Code Skills)',
            value: 'ai-friendly',
            checked: true,
            platforms: ['browser', 'react', 'vue3'],
        },
        // { name: i18n.featureSymlink, value: 'symlink', platforms: ['browser', 'react', 'vue3'] }
    ]
