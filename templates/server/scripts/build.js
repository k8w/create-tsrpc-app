const fs = require('fs');
const path = require('path');
const process = require('process');
const child_process = require('child_process');
require('colors');

// Clean
fs.rmSync('dist', { recursive: true, force: true });

// Build TypeScript
try {
    child_process.execSync('node node_modules/.bin/tsc', { stdio: 'inherit' })
}
catch (e) {
    console.error('TypeScript Compiled Error'.bgRed.white);
    process.exit(-1);
}

// Copy
let packageJSON = require('../package.json');
delete packageJSON.devDependencies;
packageJSON.scripts = {
    start: 'node index.js'
};
fs.writeFileSync('dist/package.json', JSON.stringify(packageJSON, null, 2), 'utf-8');
fs.copyFileSync('package-lock.json', 'dist/package-lock.json');

console.log('Compiled Successfully to: '.bgGreen.white);
console.log(path.resolve('dist').green)