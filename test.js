const ncu = require('npm-check-updates');

(async () => {

    const upgraded = await ncu.run({
        packageFile: './test.json',
        upgrade: true,
        target: 'minor'
    });

    // console.log(upgraded) // { "mypackage": "^2.0.0", ... }

})()