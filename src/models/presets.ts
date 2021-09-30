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
        features: ['symlink', 'unitTest']
    },
    react: {
        server: 'http',
        client: 'react',
        features: ['symlink', 'unitTest']
    },
    vue2: {
        server: 'http',
        client: 'vue2',
        features: ['symlink', 'unitTest']
    },
    vue3: {
        server: 'http',
        client: 'vue3',
        features: ['symlink', 'unitTest']
    },
}