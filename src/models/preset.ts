import { CreateOptions } from "./CreateOptions";

export const preset: { [key: string]: Omit<CreateOptions, 'projectDir'> } = {
    server: {
        server: 'http',
        client: 'none',
        features: ['eslint']
    },
    browser: {
        server: 'http',
        client: 'browser',
        features: ['eslint', 'tailwind', 'ai-friendly'],
        aiEditors: ['claude']
    },
    react: {
        server: 'http',
        client: 'react',
        features: ['eslint', 'tailwind', 'ai-friendly'],
        aiEditors: ['claude']
    },
    vue3: {
        server: 'http',
        client: 'vue3',
        features: ['eslint', 'tailwind', 'ai-friendly'],
        aiEditors: ['claude']
    },
    'server-ws': {
        server: 'ws',
        client: 'none',
        features: ['eslint']
    },
    'browser-ws': {
        server: 'ws',
        client: 'browser',
        features: ['eslint', 'tailwind']
    },
    'react-ws': {
        server: 'ws',
        client: 'react',
        features: ['eslint', 'tailwind']
    },
    'vue3-ws': {
        server: 'ws',
        client: 'vue3',
        features: ['eslint', 'tailwind']
    },
}
