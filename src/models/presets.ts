import { CreateOptions } from "./CreateOptions";

export const presets: { [key: string]: Omit<CreateOptions, 'projectDir'> } = {
    server: {
        server: 'http',
        client: 'none',
        features: []
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
    'server-ws': {
        server: 'ws',
        client: 'none',
        features: []
    },
    'browser-ws': {
        server: 'ws',
        client: 'browser',
        features: []
    },
    'react-ws': {
        server: 'ws',
        client: 'react',
        features: []
    },
    'vue2-ws': {
        server: 'ws',
        client: 'vue2',
        features: []
    },
    'vue3-ws': {
        server: 'ws',
        client: 'vue3',
        features: []
    },
}