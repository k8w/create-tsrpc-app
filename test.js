const inquirer = require('inquirer');
const child_process = require('child_process');

main();

async function main() {
    await inquirer.prompt({
        type: 'list',
        message: 'asdgasdg',
        name: 'adsgasdg',
        choices: ['asdgasdg', 'BBBB']
    });

    child_process.execSync('npx create-react-app test123 --template typescript', {stdio: 'inherit'});
}