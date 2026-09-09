const { spawn, execSync } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");
const express = require('express');
const path = require('path');
const os = require('os');

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const app = express();
// YAHAN FIX KIYA HAI: Koyeb ka port accept karega warna 20054 chalayega
const port = process.env.PORT || 20054;

// Bot start time for uptime calculation
const BOT_START_TIME = Date.now();
let botStatus = "Online";
let botPid = null;
let lastRestart = "Never";
let totalRestarts = 0;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Main dashboard route
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/dashboard.html'));
});

// ✅ INFO PAGE ROUTE
app.get('/info.html', function (req, res) {
    res.sendFile(path.join(__dirname, '/info.html'));
});

// ✅ PREFIX PAGE ROUTE - ADD THIS
app.get('/prefix.html', function (req, res) {
    res.sendFile(path.join(__dirname, '/prefix.html'));
});

// API endpoint for bot status
app.get('/api/status', (req, res) => {
    const uptime = Date.now() - BOT_START_TIME;
    const systemUptime = os.uptime() * 1000;
    
    res.json({
        bot: {
            status: botStatus,
            uptime: uptime,
            uptimeFormatted: formatUptime(uptime),
            pid: botPid,
            startTime: new Date(BOT_START_TIME).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
            lastRestart: lastRestart,
            totalRestarts: totalRestarts
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            memoryUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
            uptime: systemUptime,
            uptimeFormatted: formatUptime(systemUptime),
            hostname: os.hostname(),
            nodeVersion: process.version
        },
        timestamp: Date.now()
    });
});

// API for restart count update
app.post('/api/restart', (req, res) => {
    totalRestarts++;
    lastRestart = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    res.json({ success: true, totalRestarts, lastRestart });
});

// Format uptime function
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

app.listen(port, '0.0.0.0', () => {
    logger(`✨ Dashboard running on http://0.0.0.0:${port}`, "[ DASHBOARD ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied on port ${port}.`, "[ Error ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Error ]");
    }
});

/////////////////////////////////////////////////////////
//========= RDX-Auto-Dependency & Auto-Restart =========//
/////////////////////////////////////////////////////////

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Shaan-Khan-K.js"], {
        cwd: __dirname,
        stdio: ["inherit", "inherit", "pipe"],
        shell: true
    });

    botPid = child.pid;
    botStatus = "Online";
    
    let scriptError = "";

    child.stderr.on("data", (data) => {
        const errOutput = data.toString();
        console.error(errOutput);
        scriptError += errOutput;
    });

    child.on("close", (codeExit) => {
        botStatus = "Offline";
        
        // Update restart count via API internally
        totalRestarts++;
        lastRestart = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        
        if (scriptError.includes("Cannot find module")) {
            const moduleName = scriptError.match(/Cannot find module '(.*)'/)?.[1] || 
                               scriptError.match(/Error: Cannot find module '(.*)'/)?.[1];
            
            if (moduleName) {
                logger(`⚠️ Missing module: ${moduleName}. Auto-installing...`, "[ RDX-ENGINE ]");
                try {
                    execSync(`npm install ${moduleName}`, { stdio: "inherit" });
                    logger(`✅ Installed ${moduleName}.`, "[ RDX-ENGINE ]");
                    return startBot("Restarting after installation...");
                } catch (installError) {
                    logger(`❌ Failed to install ${moduleName}: ${installError.message}`, "[ Error ]");
                }
            }
        }

        logger(`🔄 Bot exited (Code: ${codeExit}). Restarting in 3s...`, "[ Restarting ]");
        setTimeout(() => {
            startBot("Auto-Restarting...");
        }, 3000);
    });

    child.on("error", (error) => {
        botStatus = "Error";
        logger(`❌ Error: ${JSON.stringify(error)}`, "[ Error ]");
    });
}

startBot("🚀 Initializing Bot...");

