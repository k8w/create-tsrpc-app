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
                        // Compile to ES5 in production mode for better compatibility
                        // Compile to ES2018 in development for better debugging (like async/await)
                        compilerOptions: isProduction ? {
                            "lib": ["dom", "es5", "es2015.promise"],
                            "target": "es5",
                        } : undefined
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.less$/,
                exclude: /\.module\.less$/,
                use: ['style-loader', 'css-loader', {
                    loader: "less-loader",
                    options: {
                        lessOptions: {
                            javascriptEnabled: true,
                        }
                    }
                }]
            },
            {
                test: /\.module\.less$/,
                use: ['style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true
                        }
                    },
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
            {
                test: /\.css$/,
                exclude: /\.module\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.module\.css$/,
                use: ['style-loader', {
                    loader: 'css-loader',
                    options: {
                        modules: true
                    }
                }]
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 8192, // 内联 base64 URLs, 限定 <=8k 的图片, 其他的用 URL
                        esModule: false
                    }
                }, 'img-loader']
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader",
                options: {
                    esModule: false
                }
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader",
                options: {
                    esModule: false
                }
            }
        ]
    },
    plugins: [
        // Copy "public" to "dist"
        new CopyWebpackPlugin({
            patterns: [{
                from: 'public',
                to: '.',
                toType: 'dir',
                globOptions: {
                    gitignore: true,
                    ignore: [path.resolve(__dirname, 'public/index.html').replace(/\\/g, '/')]
                },
                noErrorOnMissing: true
            }]
        }),
        // Auto add <script> to "index.html"
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        }),
    ],
    devtool: isProduction ? false : 'inline-source-map',

    optimization: {
        minimize: isProduction,
        splitChunks: {
            chunks: "all",
            minChunks: 1,
            cacheGroups: {
                default: {
                    priority: -20,
                    reuseExistingChunk: true,
                },
                vendors: {
                    test: /node_modules/,
                    priority: -10
                }
            }
        }
    },
}