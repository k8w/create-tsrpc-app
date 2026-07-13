import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取 package.json 和 copyright 脚本
const pkg = require('./package.json');
const copyright = require('./scripts/copyright');

export default {
    input: './src/index.ts',
    output: {
        format: 'cjs',
        file: './dist/index.js',
        banner: '#!/usr/bin/env node\n' + copyright,
    },
    plugins: [
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    declaration: false,
                    module: "ESNext"
                }
            },
            // 旧版的 rollupCommonJSResolveHack 属性在现代版本中已不再需要，可以直接移除
        }),
        replace({
            preventAssignment: true, // 现代版本必须设置，防止替换左值（如 a = 1）导致编译错误
            values: {
                '__CTA_VERSION__': pkg.version,
                'process.env.NODE_ENV': JSON.stringify('production')
            }
        }),
        terser({
            toplevel: true,
            mangle: {},
            format: {
                comments: /^!/
            }
        })
    ]
};