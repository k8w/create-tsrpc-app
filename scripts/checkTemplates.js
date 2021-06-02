require('colors');
const glob = require('glob');
const fs = require('fs');

let hasError = false;
glob.sync('templates/*/package.json').forEach(v => {
    let json = JSON.parse(fs.readFileSync(v, 'utf-8'));
    [json.dependencies, json.devDependencies].forEach(deps => {
        Object.keys(deps).filter(v => deps[v].indexOf('dev') > -1).forEach(v => {
            console.error('[WARN]'.yellow, v, deps[v].replace('dev', 'dev'.red));
            hasError = true;
        })
    })
});

if (hasError) {
    console.error(' ERROR '.bgRed.white, 'Check templates failed')
}
process.exit(hasError ? -1 : 0);