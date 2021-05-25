const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');



module.exports = {
    entry: './src/index.ts',
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
            { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
            // { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            // { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
            // { test: /\.(png|jpe?g|gif|webp)$/, use: [{ loader: 'url-loader', options: { esModule: false, limit: 8192 } }, 'img-loader'] }, // 内联 base64 URLs, 限定 <=8k 的图片, 其他的用 URL
            // { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader", options: { esModule: false } },
            // { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader", options: { esModule: false } }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        })
    ],
    // devServer: {
    //     host: '0.0.0.0',
    //     disableHostCheck: true,
    //     historyApiFallback: true
    // },
    // devtool: isProduction ? false : 'inline-source-map'
}