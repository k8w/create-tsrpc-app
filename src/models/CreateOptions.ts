
export interface CreateOptions {
    projectDir: string,
    server: 'http' | 'ws',
    client: ClientPlatform,
    features: (ServerFeature | ClientFeature)[]
}

export type ClientPlatform = 'browser' | 'react' | 'vue2' | 'vue3' | 'none' | 'node';

export type ServerFeature = 'unitTest';

export type ClientFeature = 'symlink';

export const serverFeatures: { name: string, value: ServerFeature, checked?: boolean }[] = [
    // { name: '演示代码', value: 'demoCode', checked: true },
    // { name: i18n.featureUnitTest, value: 'unitTest' },
]

export const clientFeatures: { name: string, value: ClientFeature, checked?: boolean, platforms: CreateOptions['client'][] }[] = [
    // { name: i18n.featureSymlink, value: 'symlink', platforms: ['browser', 'react', 'wxapp', 'vue2', 'vue3'] }
    // {
    //     name: 'WebPack 优化配置（压缩图片、分包等）',
    //     value: 'webpackOptimization',
    //     checked: true,
    //     platforms: ['browser', 'react', 'vue2', 'vue3', 'wxapp']
    // },
    // {
    //     name: 'LESS',
    //     value: 'less',
    //     platforms: ['browser', 'react', 'vue2', 'vue3', 'wxapp']
    // },
    // {
    //     name: 'Promise polyfill（兼容 IE 浏览器）',
    //     value: 'promisePolyfill',
    //     platforms: ['browser', 'react', 'vue2', 'vue3']
    // }
]