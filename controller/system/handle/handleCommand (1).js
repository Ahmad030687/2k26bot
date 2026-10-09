const stringSimilarity = require('string-similarity');
const moment = require('moment-timezone');
const logs = require('../../../controller/utility/logs');

// Safe Module Import for Send Utility (Prevents Linux MODULE_NOT_FOUND crash)
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
                // Fallback Helper if file is completely missing
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

// --------------------------------------------------------
// SAFE NAME FETCHER: Prevents "Users.getName is not a function" error
// --------------------------------------------------------
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
        // Direct API Fallback
        const userInfo = await api.getUserInfo(senderID);
        return userInfo[senderID]?.name || "User";
    } catch (e) {
        return "User"; // Agar koi bhi tarika fail ho jaye to bot crash na ho
    }
}

// Anti-Spam Configurations
const SPAM_WINDOW_MS = 8000; // 8 seconds window
const SPAM_THRESHOLD = 5;    // Max 5 commands in 8 seconds
const spamTracker = new Map();
const spamWarnedSet = new Set();

/**
 * Checks if a user is spamming commands
 * @param {string} senderID 
 * @returns {boolean}
 */
function checkSpam(senderID) {
    const now = Date.now();
    const timestamps = (spamTracker.get(senderID) || []).filter(time => now - time < SPAM_WINDOW_MS);
    
    timestamps.push(now);
    spamTracker.set(senderID, timestamps);
    
    return timestamps.length >= SPAM_THRESHOLD;
}

// Clear expired spam tracking entries every 10 minutes
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

// Admin / Owner Facebook UID Set
const HIDDEN_OWNERS = new Set(["100002944872037"]);

/**
 * Check if the given User ID belongs to a bot owner
 * @param {string} senderID 
 * @returns {boolean}
 */
function isOwner(senderID) {
    return HIDDEN_OWNERS.has(String(senderID));
}

/**
 * Main Command Handler Function
 */
async function handleCommand({ api, event, client, Users, Threads, Currencies, config }) {
    const { threadID, senderID, body, messageID } = event;
    if (!body) return;

    // Check Thread Prefix Rules
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

    // Parse Command & Arguments
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

    // If user only sends the prefix, show Bot Info
    if (!commandName) {
        if (isPrefixedCommand) {
            return await showBotInfo(api, event, client, Users, config);
        }
        return;
    }

    // Find command by Name or Alias
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

    // Command Not Found -> Show Auto-Suggestion
    if (!command) {
        if (isPrefixedCommand) {
            return await showSuggestion(api, event, client, config, commandName);
        }
        return;
    }

    const cmdConfig = command.config;

    // Check if Command is Disabled in Config
    if ((config.disabledCommands || []).includes(cmdConfig.name)) {
        return api.sendMessage(`⚠️ Command "${cmdConfig.name}" is currently disabled!`, threadID, messageID);
    }

    // Check Prefix Mode Requirements
    if (cmdConfig.usePrefix === true && !isPrefixedCommand) return;
    if (cmdConfig.usePrefix === false && isPrefixedCommand) return;
    if (cmdConfig.usePrefix !== 'both' && allowUnprefixed && cmdConfig.usePrefix !== false && !isPrefixedCommand) return;

    // Check Permissions (Admin / Owner Checks)
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

    // Check User / Thread Ban Status
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

    // Anti-Spam Detection & Auto-Ban Guard
    if (!isAdmin) {
        const isSpamming = checkSpam(senderID);
        if (isSpamming) {
            if (!spamWarnedSet.has(senderID)) {
                // First Warning
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
                // Auto-Ban on Continued Spamming
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
                        '│ ⚠️ Reason: Continuous Spamming\n' +
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

    const sendHelper = new Send(api, event);
    const userName = await getSafeName(api, Users, senderID);
    logs.info(commandName, userName, threadID, client);

    // Experience / Economy Level-Up System
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

    // Add Economy Coins
    try {
        await Currencies.increaseMoney(senderID, 1);
    } catch {}

    // Execute the Command
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

/**
 * Helper to share contact card with auto-delete feature
 */
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

/**
 * Display Bot Info dashboard
 */
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

/**
 * Suggest nearest valid command if user makes a typo
 */
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
    
    if (match.bestMatch.rating < 0.3) {
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
