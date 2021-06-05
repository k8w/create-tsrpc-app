const fs = require('fs');
const path = require('path');

// package.json
let json = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
delete json.devDependencies;
delete json.scripts;
fs.writeFileSync(path.resolve(__dirname, '../dist/package.json'), JSON.stringify(json, null, 2))
