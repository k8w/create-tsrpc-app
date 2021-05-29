const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const isProduction = process.argv.indexOf('--mode=production') > -1;

module.exports = {
    entry: './src/index.tsx',
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: isProduction ? {
                            "lib": [
                                "dom",
                                "es2015.promise"
                            ],
                            "target": "es5",
                        } : undefined
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.less$/, use: ['style-loader', 'css-loader',
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                javascriptEnabled: true,
                            }
                        }
                    }
                ]
            },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            { test: /\.(png|jpe?g|gif)$/, use: [{ loader: 'url-loader', options: { limit: 8192, esModule: false } }, 'img-loader'] }, // 内联 base64 URLs, 限定 <=8k 的图片, 其他的用 URL
            { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader", options: { esModule: false } },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader", options: { esModule: false } }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: 'public',
                to: '.',
                toType: 'dir',
                globOptions: {
                    gitignore: true,
                    ignore: [
                        path.resolve(__dirname, 'public/index.html')
                    ]
                },
                noErrorOnMissing: true
            }]
        }),
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        })
    ],
    devtool: isProduction ? false : 'inline-source-map'
}