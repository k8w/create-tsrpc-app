import { CreateOptions } from "./CreateOptions";

export const presets: { [key: string]: Omit<CreateOptions, 'projectDir'> } = {
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
    vue: {
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