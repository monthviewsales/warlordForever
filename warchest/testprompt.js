const inquirer = require('inquirer');
const chalk = require('chalk');

console.log(chalk.yellow('Starting test prompt...'));
inquirer.prompt([
    {
        type: 'password',
        name: 'testKey',
        message: 'Enter somethin\' (won\'t echo):',
    }
]).then(answers => {
    console.log(chalk.green('Got input:'), answers.testKey.length, 'chars long');
}).catch(err => {
    console.error(chalk.red('Prompt error:'), err);
});