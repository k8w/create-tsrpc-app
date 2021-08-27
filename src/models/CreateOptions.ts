import { i18n } from "../i18n/i18n";

export interface CreateOptions {
    projectDir: string,
    server: 'http' | 'ws',
    client: ClientPlatform,
    features: (ServerFeature | ClientFeature)[]
}

export type ClientPlatform = 'node' | 'browser' | 'react' | 'vue2' | 'vue3' | 'wxapp' | 'none';

export type ServerFeature = 'unitTest' | 'demoCode';

export type ClientFeature = 'less' | 'webpackOptimization' | 'promisePolyfill' | 'symlink'

export const serverFeatures: { name: string, value: ServerFeature, checked?: boolean }[] = [
    // { name: '演示代码', value: 'demoCode', checked: true },
    { name: i18n.featureUnitTest, value: 'unitTest' },
]

export const clientFeatures: { name: string, value: ClientFeature, checked?: boolean, platforms: CreateOptions['client'][] }[] = [
    { name: i18n.featureSymlink, value: 'symlink', platforms: ['browser', 'react', 'wxapp', 'vue2', 'vue3'] }
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