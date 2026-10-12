const { spawn } = require('child_process');
const chalk = require('chalk');
const moment = require('moment-timezone');
const fs = require('fs');

const BOT_SCRIPT = 'main.js';
const RESTART_DELAY = 2000;
const MAX_RESTARTS_FAST = 10;
const FAST_RESTART_WINDOW = 60000;
const START_TIME_FILE = __dirname + '/bot_connect';

let restartCount = 0;
let lastRestartTime = Date.now();

try {
    if (!fs.existsSync(__dirname + '/bot_connect')) {
        fs.mkdirSync(__dirname + '/bot_connect', { recursive: true });
    }
    fs.writeFileSync(START_TIME_FILE, JSON.stringify({ 'startTime': Date.now() }));
} catch (e) {}

function getTime() {
    return moment().tz('Asia/Karachi').format('hh:mm:ss A');
}

function log(type, message) {
    const time = getTime();
    if (type === 'INFO') console.log(chalk.cyan(`[${time} [INFO]] `) + chalk.white(message));
    else if (type === 'SUCCESS') console.log(chalk.green(`[${time} [SUCCESS]] `) + chalk.green(message));
    else if (type === 'WARN') console.log(chalk.yellow(`[${time} [WARN]] `) + chalk.yellow(message));
    else if (type === 'ERROR') console.log(chalk.red(`[${time} [ERROR]] `) + chalk.red(message));
    else console.log(chalk.magenta(`[${time} [SYSTEM]] `) + chalk.magenta(message));
}

function showBanner() {
    console.log();
    console.log(chalk.hex('#FF4D4D')(' ╔══════════════════════════╗'));
    console.log(chalk.hex('#FF4D4D').bold(' ║     AHMAD RDX BOT v2     ║'));
    console.log(chalk.hex('#FF4D4D')(' ╚══════════════════════════╝'));
    console.log(chalk.hex('#FF4D4D')(' ║   Anti-Ban & Human Guard ║'));
    console.log(chalk.gray(' System : ') + chalk.white(process.platform + ' | Node ' + process.version));
    console.log();
}

function startBot() {
    if (Date.now() - lastRestartTime > FAST_RESTART_WINDOW) {
        restartCount = 0;
    }
    lastRestartTime = Date.now();
    log('SYSTEM', 'Starting AHMAD RDX Bot process...');

    const child = spawn('node', [BOT_SCRIPT], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    child.on('error', (err) => {
        log('ERROR', 'Process error: ' + err.message);
    });

    child.on('exit', (code) => {
        if (code === 0) {
            log('SYSTEM', 'Bot stopped normally.');
            process.exit(0);
        } else {
            restartCount++;
            if (restartCount > MAX_RESTARTS_FAST) {
                log('ERROR', 'Too many restarts (' + restartCount + '). Pausing for 30 seconds...');
                setTimeout(startBot, 30000);
            } else {
                log('WARN', 'Bot crashed with code ' + code + '. Restarting in ' + RESTART_DELAY / 1000 + 's...');
                setTimeout(startBot, RESTART_DELAY);
            }
        }
    });
}

showBanner();
log('SYSTEM', 'Initializing human-like protections...');
startBot();
