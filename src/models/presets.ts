import { CreateOptions } from "./CreateOptions";

export const presets: { [key: string]: Omit<CreateOptions, 'projectDir'> } = {
    server: {
        server: 'http',
        client: 'none',
        features: ['unitTest']
    },
    browser: {
        server: 'http',
        client: 'browser',
        features: []
    },
    react: {
        server: 'http',
        client: 'react',
        features: []
    },
    vue2: {
        server: 'http',
        client: 'vue2',
        features: []
    },
    vue3: {
        server: 'http',
        client: 'vue3',
        features: []
    },
}