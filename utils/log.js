const chalk = require('chalk');

module.exports = (data, option) => {
    switch (option) {
        case 'warn':
            console.log(chalk.bold.hex('#FF00FF')('[ Error ] » ') + data);
            break;
        case 'error':
            console.log(chalk.bold.hex('#FF00FF')('[ Error ] » ') + data);
            break;
        default:
            console.log(chalk.bold.hex('#FF0000')(`${option} » `) + data);
            break;
    }
};

module.exports.loader = (data, option) => {
    switch (option) {
        case 'warn':
            console.log(chalk.bold.hex('#b4ff33')('[ 𝐒𝐇𝐀𝐀𝐍-𝐏𝐑𝐎𝐉𝐄𝐂𝐓 😈 ] » ') + data);
            break;
        case 'error':
            console.log(chalk.bold.hex('#ff334b')('[ Error ] » ') + data);
            break;
        default:
            // Yeh wahi main green/blue color hai jo aapne screenshot mein bheja tha
            console.log(chalk.bold.hex('#33ffc9')('[ 𝐒𝐇𝐀𝐀𝐍-𝐏𝐑𝐎𝐉𝐄𝐂𝐓 😈 ] » ') + data);
            break;
    }
};
