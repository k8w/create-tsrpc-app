const fse = require('fs-extra');
const fs = require('fs');

const type = process.argv[2];
if (type !== 'ws' && type !== 'http') {
    console.error('Error type: ' + type);
    process.exit(-1);
}

let dirs = fs.readdirSync('templates');
dirs.forEach(dir => {
    try {
        fse.ensureSymlinkSync(`templates/${dir}/src-${type}`, `templates/${dir}/src`);
    }
    catch (e) {
        console.error(`Error ${dir}: ${e.message}`)
    }
})

console.log('done');