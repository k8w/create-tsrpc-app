const fs = require('fs');
const path = require('path');
const glob = require('glob');

glob.sync('templates/client*/src*/shared').forEach(v => {
    console.log('Delete: ' + v);
    fs.rmSync(v, { force: true, recursive: true });
})