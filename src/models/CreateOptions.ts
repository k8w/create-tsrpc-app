import { i18n } from '../i18n/i18n'
export type AIEditor = 'claude' | 'opencode' | 'trae'

export interface CreateOptions {
    projectDir: string
    server: 'http' | 'ws'
    client: ClientPlatform
    features: (ServerFeature | ClientFeature | CommonFeature)[]
    aiEditors?: AIEditor[]  // Selected AI editors when ai-friendly is enabled
}

export type ClientPlatform = 'browser' | 'react' | 'vue3' | 'none' | 'node'

export type ServerFeature = 'unitTest'

export type ClientFeature = 'symlink' | 'tailwind' | 'ai-friendly'

export type CommonFeature = 'eslint'

export const commonFeatures: {
    name: string
    value: CommonFeature
    checked?: boolean
}[] = [
        { name: 'ESLint', value: 'eslint', checked: true },
    ]

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
            name: i18n.featureAIFriendly,
            value: 'ai-friendly',
            checked: true,
            platforms: ['browser', 'react', 'vue3'],
        },
        {
            name: 'Tailwind CSS',
            value: 'tailwind',
            checked: true,
            platforms: ['browser', 'react', 'vue3'],
        },
        // { name: i18n.featureSymlink, value: 'symlink', platforms: ['browser', 'react', 'vue3'] }
    ]
