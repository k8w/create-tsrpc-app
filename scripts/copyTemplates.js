const child_process = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

let files = glob.sync('templates/**/*', {
    ignore: [
        'templates/**/node_modules/**',
        'templates/**/dist/**',
        'templates/**/.DS_STORE',
        'templates/**/package-lock.json',
        'templates/**/src/**',
        'templates/**/test/**',
        'templates/client-browser/public/**'
    ],
    nocase: true
}).concat(glob.sync('templates/*/.gitignore'));

let count = 0;
files.forEach(v => {
    if (fs.statSync(v).isFile()) {
        // console.log(`Copy: ${v}`)
        fs.copyFileSync(v, path.join('dist', v));
        ++count
    }
    else if (fs.statSync(v).isDirectory()) {
        fs.ensureDirSync(path.join('dist', v))
    }
})
console.log(`${count} template files copied.`)