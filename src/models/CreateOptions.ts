export interface CreateOptions {
    projectDir: string,
    server: 'http' | 'ws',
    client: ClientPlatform,
    serverFeatures: ServerFeature[],
    clientFeatures: ClientFeature[]
}

export type ClientPlatform = 'node' | 'browser' | 'react' | 'vue2' | 'vue3' | 'wxapp' | 'none';

export type ServerFeature = 'unitTest' | 'demoCode' | 'symlink';

export type ClientFeature = 'less' | 'webpackOptimization' | 'promisePolyfill'

export const serverFeatures: { name: string, value: ServerFeature }[] = [
    { name: '单元测试（Mocha）', value: 'unitTest' },
    { name: '演示协议和 API 实现', value: 'demoCode' },
    { name: '使用 Symlink 同步共享文件夹（Windows 不推荐）', value: 'symlink' }
]

export const clientFeatures: { name: string, value: ClientFeature, platforms: CreateOptions['client'][] }[] = [
    {
        name: 'LESS',
        value: 'less',
        platforms: ['browser', 'react', 'vue2', 'vue3', 'wxapp']
    },
    {
        name: 'WebPack 优化配置（压缩图片、分包等）',
        value: 'webpackOptimization',
        platforms: ['browser', 'react', 'vue2', 'vue3', 'wxapp']
    },
    {
        name: 'Promise polyfill（兼容 IE 浏览器）',
        value: 'promisePolyfill',
        platforms: ['browser', 'react', 'vue2', 'vue3']
    }
]