export interface CreateOptions {
    projectDir: string,
    server: 'http' | 'ws',
    client: ClientPlatform,
    features: (ServerFeature | ClientFeature)[]
}

export type ClientPlatform = 'node' | 'browser' | 'react' | 'vue2' | 'vue3' | 'wxapp' | 'none';

export type ServerFeature = 'unitTest' | 'demoCode' | 'symlink';

export type ClientFeature = 'less' | 'webpackOptimization' | 'promisePolyfill'

export const serverFeatures: { name: string, value: ServerFeature, checked?: boolean }[] = [
    // { name: '演示代码', value: 'demoCode', checked: true },
    // { name: '单元测试' + '（Mocha）'.yellow, value: 'unitTest' },
    // { name: '使用 Symlink 自动同步共享目录' + '（Windows 不推荐）'.yellow, value: 'symlink' }
]

export const clientFeatures: { name: string, value: ClientFeature, checked?: boolean, platforms: CreateOptions['client'][] }[] = [
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