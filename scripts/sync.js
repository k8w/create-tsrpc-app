const fse = require('fs-extra');
const fs = require('fs');

const type = process.argv[2];
if (type !== 'ws' && type !== 'http') {
    console.error('Error type: ' + type);
    process.exit(-1);
}

let dirs = fs.readdirSync('templates');
dirs.filter(v => v !== 'server').forEach(dir => {
    try {
        fse.rmSync(`templates/${dir}/src-${type}/shared`, { recursive: true, force: true });
        fse.copySync(`templates/server/src-${type}/shared`, `templates/${dir}/src-${type}/shared`, { recursive: true });
    }
    catch (e) {
        console.error(`Error ${dir}: ${e.message}`)
    }
})

console.log('done');