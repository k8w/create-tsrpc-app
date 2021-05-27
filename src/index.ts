import 'colors';
import inquirer from 'inquirer';

(async function () {
    console.log('欢迎来到我的世界 v1.0'.bgGreen.white)

    let result = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'really',
            message: 'Conflict on `file.js`? ' + 'aadsaf'.gray,
            default: false
        },
    ], {
        theme: 'Ask opening hours',
    });
    console.log('Answer: ', result);
})();