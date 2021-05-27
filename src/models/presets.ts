import { CreateOptions } from "./CreateOptions";

export const presets: { [key: string]: Omit<CreateOptions, 'projectDir'> } = {
    browser: {
        server: 'http',
        client: 'browser',
        serverFeatures: [],
        clientFeatures: []
    }
}