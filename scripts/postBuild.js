const fs = require('fs');

// package.json
let json = JSON.parse(fs.readFileSync('./package.json'));
delete json.devDependencies;
delete json.scripts;
fs.writeFileSync('./dist/package.json', JSON.stringify(json, null, 2))

// replace __CTA_VERSION__
let content = fs.readFileSync('dist/index.js', 'utf-8');
content = content.replace(/__CTA_VERSION__/g, json.version);
fs.writeFileSync('dist/index.js', content, 'utf-8');
console.log('')