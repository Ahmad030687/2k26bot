/**
 * Shortcut Command Module
 * Path: Sardar/commands/shortcut.js
 * Hardcoded GitHub Credentials & Auto-Reload Engine
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const shortcutsPath = path.join(__dirname, '..', 'cache', 'shortcuts.json');

// Hardcoded GitHub Configuration
const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'Ahmad030687/2k26bot';
const GITHUB_BRANCH = 'main';

// Helper: GitHub par json update push karna
async function pushShortcutsToGithub(content, commitMessage) {
    try {
        const filePathInRepo = 'Sardar/cache/shortcuts.json';
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePathInRepo}`;
        
        let sha = null;
        try {
            const getRes = await axios.get(`${url}?ref=${GITHUB_BRANCH}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AHMAD-RDX-Bot'
                }
            });
            sha = getRes.data.sha;
        } catch (e) {}

        const payload = {
            message: commitMessage,
            content: Buffer.from(content, 'utf8').toString('base64'),
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        await axios.put(url, payload, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AHMAD-RDX-Bot'
            }
        });
    } catch (err) {
        console.error('[AHMAD RDX Shortcut GitHub Push Error]:', err.message);
    }
}

// Shortcuts helper functions
function getShortcuts() {
    try {
        if (!fs.existsSync(shortcutsPath)) {
            fs.ensureFileSync(shortcutsPath);
            fs.writeFileSync(shortcutsPath, '{}', 'utf8');
            return {};
        }
        const data = fs.readFileSync(shortcutsPath, 'utf8');
        return JSON.parse(data || '{}');
    } catch (e) {
        return {};
    }
}

function saveShortcuts(data) {
    try {
        fs.ensureFileSync(shortcutsPath);
        const jsonStr = JSON.stringify(data, null, 2);
        fs.writeFileSync(shortcutsPath, jsonStr, 'utf8');
        pushShortcutsToGithub(jsonStr, 'Update shortcuts.json via AHMAD RDX bot');
    } catch (e) {
        console.error('[AHMAD RDX Save Shortcut Error]:', e.message);
    }
}

module.exports = {
    config: {
        credits: 'SARDAR RDX', // Core validator protection
        name: 'shortcut',
        aliases: ['short', 'sc'],
        version: '1.0.0',
        permission: 0,
        description: 'Interactive shortcut setup command by AHMAD RDX',
        eventType: 'message'
    },

    // Global listener jo har simple message par trigger hoga aur shortcut check karega
    async handleEvent({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        const shortcuts = getShortcuts();
        const inputKey = body.trim().toLowerCase();

        if (shortcuts[inputKey]) {
            return api.sendMessage(shortcuts[inputKey], threadID, messageID);
        }
    },

    async run({ api, event }) {
        const { threadID, messageID, type, messageReply, body } = event;

        // Step 3: Jab user response text ka reply kare
        if (type === 'message_reply' && messageReply) {
            const replyText = messageReply.body || '';

            // Agar Step 1 ke reply ka jawaab hai (Shortcut Key)
            if (replyText.includes('👇 Is message ke reply mein wo Word, Emoji ya Number likho')) {
                const shortcutKey = body.trim().toLowerCase();

                if (!shortcutKey) {
                    return api.sendMessage('❌ Invalid shortcut key!', threadID, messageID);
                }

                return api.sendMessage(
                    `📝 Aapka shortcut key: "${shortcutKey}" select ho gaya hai.\n\n👇 Ab is message ke reply mein wo Text/Syntax likhein jo aap save karwana chahte hain:`,
                    threadID,
                    (err, info) => {
                        global.client = global.client || {};
                        global.client.handleReply = global.client.handleReply || [];
                        global.client.handleReply.push({
                            name: 'shortcut',
                            messageID: info.messageID,
                            author: event.senderID,
                            step: 2,
                            key: shortcutKey
                        });
                    },
                    messageID
                );
            }
        }

        // Step 1: User jab direct .shortcut likhe
        return api.sendMessage(
            '👇 Is message ke reply mein wo Word, Emoji ya Number likho jiska shortcut banana chahte ho:',
            threadID,
            (err, info) => {
                global.client = global.client || {};
                global.client.handleReply = global.client.handleReply || [];
                global.client.handleReply.push({
                    name: 'shortcut',
                    messageID: info.messageID,
                    author: event.senderID,
                    step: 1
                });
            },
            messageID
        );
    },

    // Dynamic reply handler
    async handleReply({ api, event, handleReply }) {
        const { threadID, messageID, body, author } = event;
        if (author !== handleReply.author) return;

        // Step 1 Answer: Shortcut Key receive ho gayi
        if (handleReply.step === 1) {
            const shortcutKey = body.trim().toLowerCase();
            if (!shortcutKey) {
                return api.sendMessage('❌ Invalid shortcut key!', threadID, messageID);
            }

            return api.sendMessage(
                `📝 Shortcut Key: "${shortcutKey}"\n\n👇 Ab is message ke reply mein wo Response/Syntax text likhein jo bot bole:`,
                threadID,
                (err, info) => {
                    global.client.handleReply.push({
                        name: 'shortcut',
                        messageID: info.messageID,
                        author: author,
                        step: 2,
                        key: shortcutKey
                    });
                },
                messageID
            );
        }

        // Step 2 Answer: Response/Syntax text receive ho gaya
        if (handleReply.step === 2) {
            const responseText = body.trim();
            const shortcutKey = handleReply.key;

            if (!responseText) {
                return api.sendMessage('❌ Syntax text khali nahi ho sakta!', threadID, messageID);
            }

            const shortcuts = getShortcuts();
            shortcuts[shortcutKey] = responseText;
            saveShortcuts(shortcuts);

            return api.sendMessage(
                `✅ Success! Shortcut successfully save ho gaya hai.\n\n🔑 Key: "${shortcutKey}"\n💬 Response: "${responseText}"\n\nAb jab bhi koi "${shortcutKey}" likhega, bot yeh text bolega!`,
                threadID,
                messageID
            );
        }
    }
};