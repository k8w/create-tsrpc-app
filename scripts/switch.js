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
        fse.existsSync(`templates/${dir}/src`) && fse.rmSync(`templates/${dir}/src`, { force: true, recursive: true })
        fse.ensureSymlinkSync(`templates/${dir}/src-${type}`, `templates/${dir}/src`);
    }
    catch (e) {
        console.error(`Error ${dir}: ${e.message}`)
    }
})

// Server Test Case
fse.existsSync(`templates/server/test`) && fse.rmSync(`templates/server/test`, { force: true, recursive: true })
fse.ensureSymlinkSync(`templates/server/test-${type}`, `templates/server/test`);

// Browser Public
fse.existsSync(`templates/client-browser/public`) && fse.rmSync(`templates/client-browser/public`, { force: true, recursive: true })
fse.ensureSymlinkSync(`templates/client-browser/public-${type}`, `templates/client-browser/public`);


console.log('done');