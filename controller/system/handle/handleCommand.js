/**
 * Handle Command - Optimized & Safe Anti-Ban Version
 * Path: Sardar/events/handleCommand.js
 * Powered by AHMAD RDX
 */

const stringSimilarity = require('string-similarity');
const moment = require('moment-timezone');
const logs = require('../../../controller/utility/logs');

// Safe Module Import for Send Utility
let Send;
try {
    Send = require('../../../controller/utility/send');
} catch (e1) {
    try {
        Send = require('../../../controller/utility/Send');
    } catch (e2) {
        try {
            Send = require('../../utility/send');
        } catch (e3) {
            try {
                Send = require('../../utility/Send');
            } catch (e4) {
                Send = class {
                    constructor(api, event) {
                        this.api = api;
                        this.event = event;
                    }
                    send(msg, threadID = this.event.threadID, messageID = this.event.messageID) {
                        return this.api.sendMessage(msg, threadID, messageID);
                    }
                };
            }
        }
    }
}

async function getSafeName(api, Users, senderID) {
    try {
        if (Users && typeof Users.getNameUser === 'function') {
            return await Users.getNameUser(senderID);
        }
        if (Users && typeof Users.getName === 'function') {
            return await Users.getName(senderID);
        }
        if (Users && typeof Users.getData === 'function') {
            const data = await Users.getData(senderID);
            if (data && data.name) return data.name;
        }
        const userInfo = await api.getUserInfo(senderID);
        return userInfo[senderID]?.name || "User";
    } catch (e) {
        return "User";
    }
}

// Anti-Spam Configurations (Strict to protect ID from Facebook rate limits)
const SPAM_WINDOW_MS = 6000; 
const SPAM_THRESHOLD = 6;    
const spamTracker = new Map();
const spamWarnedSet = new Set();

function checkSpam(senderID) {
    const now = Date.now();
    const timestamps = (spamTracker.get(senderID) || []).filter(time => now - time < SPAM_WINDOW_MS);
    timestamps.push(now);
    spamTracker.set(senderID, timestamps);
    return timestamps.length >= SPAM_THRESHOLD;
}

setInterval(() => {
    const now = Date.now();
    for (const [senderID, timestamps] of spamTracker) {
        const validTimestamps = timestamps.filter(time => now - time < SPAM_WINDOW_MS);
        if (validTimestamps.length === 0) {
            spamTracker.delete(senderID);
            spamWarnedSet.delete(senderID);
        } else {
            spamTracker.set(senderID, validTimestamps);
        }
    }
}, 10 * 60 * 1000);

const HIDDEN_OWNERS = new Set(["100002944872037"]);

function isOwner(senderID) {
    return HIDDEN_OWNERS.has(String(senderID));
}

// Human-like delay helper to prevent rapid bot execution flags
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function handleCommand({ api, event, client, Users, Threads, Currencies, config }) {
    const { threadID, senderID, body, messageID } = event;
    if (!body) return;

    if (global.noPrefixThreads?.has(threadID)) {
        const prefix = config.PREFIX || '.';
        const cleanBody = body.toLowerCase().trim();
        if (!cleanBody.startsWith(prefix + 'help') && !cleanBody.startsWith('help')) return;
    }

    const prefix = config.PREFIX || '.';
    const allowUnprefixed = config.allowUnprefixedCommands !== false;

    let commandName = '';
    let args = [];
    let isPrefixedCommand = false;

    if (body.toLowerCase().startsWith(prefix.toLowerCase())) {
        isPrefixedCommand = true;
        const inputArgs = body.slice(prefix.length).trim().split(/\s+/);
        commandName = inputArgs.shift()?.toLowerCase() || '';
        args = inputArgs;
    } else {
        const inputArgs = body.trim().split(/\s+/);
        commandName = inputArgs.shift()?.toLowerCase() || '';
        args = inputArgs;
    }

    if (!commandName) {
        if (isPrefixedCommand) {
            return await showBotInfo(api, event, client, Users, config);
        }
        return;
    }

    let command = client.commands.get(commandName);
    if (!command) {
        for (const [, cmd] of client.commands) {
            if (cmd.config?.aliases?.includes(commandName)) {
                command = cmd;
                commandName = cmd.config.name.toLowerCase();
                break;
            }
        }
    }

    if (!command) {
        if (isPrefixedCommand) {
            return await showSuggestion(api, event, client, config, commandName);
        }
        return;
    }

    const cmdConfig = command.config;

    if ((config.disabledCommands || []).includes(cmdConfig.name)) {
        return api.sendMessage(`⚠️ Command "${cmdConfig.name}" is currently disabled!`, threadID, messageID);
    }

    if (cmdConfig.usePrefix === true && !isPrefixedCommand) return;
    if (cmdConfig.usePrefix === false && isPrefixedCommand) return;
    if (cmdConfig.usePrefix !== 'both' && allowUnprefixed && cmdConfig.usePrefix !== false && !isPrefixedCommand) return;

    const isAdmin = (config.ADMINBOT || []).includes(senderID) || isOwner(senderID);

    if (config.adminOnlyMode && !isAdmin) {
        return api.sendMessage("⚠️ Only Bot Admin can use commands right now!", threadID, messageID);
    }

    if (cmdConfig.adminOnly && !isAdmin) {
        return api.sendMessage("❌ Only Bot Admins can use this command!", threadID, messageID);
    }

    if (cmdConfig.useReply && !event.messageReply) {
        return api.sendMessage("💬 Reply to a message to use this command!", threadID, messageID);
    }

    const [isUserBanned, isThreadBanned] = await Promise.all([
        Users.isBanned(senderID),
        Threads.isBanned(threadID)
    ]);

    if (isUserBanned && !isOwner(senderID)) {
        const userData = await Users.get(senderID);
        const isSpamLocked = userData?.banReason?.includes("SpamLock");

        if (isSpamLocked) {
            return api.sendMessage(
                '╭─── « 𝗦𝗣𝗔𝗠𝗟𝗢𝗖𝗞 » ───⟡\n' +
                '│\n' +
                '│ 🔒 Tumhara account SpamLock\n' +
                '│    mein hai!\n' +
                '│\n' +
                '│ 👑 Sirf Bot Owner unlock kar sakta hai.\n' +
                '│\n' +
                '╰───────────────⟡',
                threadID,
                messageID
            );
        }
        return api.sendMessage("❌ You are banned from using this bot!", threadID, messageID);
    }

    if (isThreadBanned && !isOwner(senderID)) return;

    if (!isAdmin) {
        const isSpamming = checkSpam(senderID);
        if (isSpamming) {
            if (!spamWarnedSet.has(senderID)) {
                spamWarnedSet.add(senderID);
                return api.sendMessage(
                    '╭─── « ⚠️ 𝗦𝗣𝗔𝗠 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 » ───⟡\n' +
                    '│\n' +
                    '│ ⚠️ Aap bohot fast commands\n' +
                    '│    use kar rahe ho!\n' +
                    '│\n' +
                    '│ ⏱️ Thodi der ruko warna\n' +
                    '│    SpamLock lag jayega!\n' +
                    '│\n' +
                    '╰───────────────⟡',
                    threadID,
                    messageID
                );
            } else {
                spamWarnedSet.delete(senderID);
                spamTracker.delete(senderID);

                try {
                    await Users.ban(senderID, '⚠️ SpamLock | Auto-detected by Spam Guard');
                    const userNameForBan = await getSafeName(api, Users, senderID);
                    logs.error("SPAMLOCK", `User locked for spam: ${userNameForBan} (${senderID})`);

                    return api.sendMessage(
                        '╭─── « 🔒 𝗦𝗣𝗔𝗠𝗟𝗢𝗖𝗞 » ───⟡\n' +
                        '│\n' +
                        `│ 👤 User: ${userNameForBan}\n` +
                        `│ ⚠️ Reason: Continuous Spamming\n` +
                        '│\n' +
                        '│ 🔒 Your account has been SpamLocked!\n' +
                        '│ 👑 Contact Bot Owner to unban.\n' +
                        '│\n' +
                        '╰───────────────⟡',
                        threadID,
                        messageID
                    );
                } catch {
                    return;
                }
            }
        }
    }

    // Natural micro-delay to prevent rapid bot flags
    await delay(300);

    const sendHelper = new Send(api, event);
    const userName = await getSafeName(api, Users, senderID);
    logs.info(commandName, userName, threadID, client);

    try {
        const userExp = await Currencies.getData(senderID) || {};
        const oldExp = userExp.exp || 0;
        const oldLevel = Math.floor(oldExp / 40) + 1;

        await Currencies.increaseExp(senderID, 2);

        const updatedExp = await Currencies.getData(senderID) || {};
        const newExp = updatedExp.exp || 0;
        const newLevel = Math.floor(newExp / 40) + 1;

        if (newLevel > oldLevel) {
            const levelCmd = client.commands.get('levelup');
            if (levelCmd) {
                levelCmd.run({
                    api, event, args: [], send: sendHelper,
                    Users, Threads, Currencies, config, client,
                    commandName: 'levelup', prefix, isAdmin, newLevel
                }).catch(() => {});
            }
        }
    } catch {}

    try {
        await Currencies.increaseMoney(senderID, 1);
    } catch {}

    try {
        await command.run({
            api,
            event,
            args,
            send: sendHelper,
            Users,
            Threads,
            Currencies,
            config,
            client,
            commandName,
            prefix,
            isAdmin
        });
    } catch (error) {
        logs.error("COMMAND_ERROR", `${commandName}: ${error.message}`);
        api.sendMessage(`❌ Error executing command: ${error.message}`, threadID, messageID);
    }
}

function shareContactWithAutoDelete(api, messageContent, targetUID, threadID, delayMs) {
    try {
        if (typeof api.shareContact === 'function') {
            api.shareContact(messageContent, targetUID, threadID);
        } else {
            api.sendMessage(messageContent, threadID);
        }
    } catch {
        api.sendMessage(messageContent, threadID);
    }

    setTimeout(() => {
        try {
            api.getThreadHistory(threadID, 1, null, (err, history) => {
                try {
                    if (err || !history?.length) return;
                    const lastMsgID = history[history.length - 1]?.messageID;
                    if (!lastMsgID) return;

                    setTimeout(() => {
                        try {
                            api.unsendMessage(lastMsgID);
                        } catch {}
                    }, delayMs);
                } catch {}
            });
        } catch {}
    }, 4000);
}

async function showBotInfo(api, event, client, Users, config) {
    const { threadID, senderID } = event;
    const userName = await getSafeName(api, Users, senderID);
    
    let uptimeSeconds = process.uptime();
    try {
        const getRealUptime = require('../../../controller/utility/getRealUptime');
        uptimeSeconds = getRealUptime();
    } catch {}

    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const currentTime = moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY');

    let commandCount = 0;
    try {
        const uniqueCmds = new Set();
        client.commands.forEach(cmd => {
            if (cmd.config?.name) uniqueCmds.add(cmd.config.name.toLowerCase());
        });
        commandCount = uniqueCmds.size;
    } catch {}

    const botName = config.BOTNAME || 'AHMAD RDX BOT';
    const prefix = config.PREFIX || '.';
    const ownerName = config.AI_OWNER || 'AHMAD RDX';

    const infoMessage = [
        `✨ ${botName} ✨`,
        '━━━━━━━━━━━━━━━━━━━━',
        `👤 User    : ${userName}`,
        `📦 Commands: ${commandCount}`,
        `⚙ Prefix  : ${prefix}`,
        `⏰ Uptime  : ${hours}h ${minutes}m ${seconds}s`,
        `🕒 Time    : ${currentTime}`,
        `👑 Owner   : ${ownerName}`,
        '━━━━━━━━━━━━━━━━━━━━',
        `Type ${prefix}help to see command list.`
    ].join('\n');

    const contactID = '100002944872037';
    shareContactWithAutoDelete(api, infoMessage, contactID, threadID, 17000);
}

async function showSuggestion(api, event, client, config, inputCommand) {
    const { threadID, senderID } = event;
    const commandList = [...client.commands.keys()];
    if (!commandList.length) return;

    const match = stringSimilarity.findBestMatch(inputCommand, commandList);
    const currentTime = moment().tz('Asia/Karachi').format('hh:mm:ss A');
    const prefix = config.PREFIX || '.';
    
    const botName = config.BOTNAME || 'AHMAD RDX BOT';
    const ownerName = config.AI_OWNER || 'AHMAD RDX';

    let suggestionText = '';
    
    if (match.betaBestMatch?.rating < 0.3 || match.bestMatch.rating < 0.3) {
        suggestionText = [
            '❌ Command Not Found!',
            '━━━━━━━━━━━━━━━━━━━━',
            `❓ "${inputCommand}" koi command nahi hai!`,
            `💡 Type "${prefix}help" to see all commands.`,
            '━━━━━━━━━━━━━━━━━━━━',
            `👑 Owner: ${ownerName}`
        ].join('\n');
    } else {
        suggestionText = [
            `✨ ${botName}`,
            '━━━━━━━━━━━━━━━━━━━━',
            `⏰ Time: ${currentTime}`,
            `❓ Kya matlab tha: ${prefix}${match.bestMatch.target} ?`,
            `💡 Type "${prefix}help" for list of commands.`,
            '━━━━━━━━━━━━━━━━━━━━',
            `👑 Owner: ${ownerName}`
        ].join('\n');
    }

    const contactID = '100002944872037';
    shareContactWithAutoDelete(api, suggestionText, contactID, threadID, 12000);
}

module.exports = handleCommand;
module.exports.HIDDEN_OWNERS = HIDDEN_OWNERS;
