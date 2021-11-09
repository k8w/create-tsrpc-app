const CracoLessPlugin = require("craco-less");

module.exports = {
    webpack: {
        configure: {
            resolve: {
                symlinks: false,
            },
        },
    },
    plugins: [
        {
            plugin: CracoLessPlugin,
        }
    ],
};