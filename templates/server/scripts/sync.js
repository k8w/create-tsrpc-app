const fs = require('fs');
const process = require('process');
const path = require('path');
require('colors');

process.chdir(path.resolve(__dirname, '../'));

// Sync Config
const syncConfig = [
    { from: 'src/shared', to: '../browser/src/shared' }
];

function copyDirReadonly(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }

    let dir = fs.readdirSync(src);
    dir.forEach(v => {
        let srcPath = path.join(src, v);
        let destPath = path.join(dest, v);
        let stat = fs.statSync(srcPath);

        if (stat.isFile()) {
            fs.copyFileSync(srcPath, destPath);
            fs.chmodSync(destPath, 0o444);
            console.log(path.resolve(destPath).green);
        }
        else if (stat.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            console.log(path.resolve(destPath).green);
            copyDirReadonly(srcPath, destPath);
        }
        else {
            console.log(`Ignored: "${srcPath}"`.yellow);
        }
    })
}

syncConfig.forEach(v => {
    console.log(` Syncing from "${v.from}" to "${v.to}"... `.bgBlue.white);
    // Clear
    fs.rmSync(v.to, { force: true, recursive: true });
    // Copy
    copyDirReadonly(v.from, v.to);
});

console.log(' Done '.bgBlue.white);