/**
 * Shortcut Command Module
 * Path: Sardar/commands/shortcut.js
 * Credits: SARDAR RDX (Validator Approved)
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const shortcutsPath = path.join(__dirname, '..', 'cache', 'shortcuts.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const GITHUB_REPO = 'Ahmad030687/2k26bot';
const GITHUB_BRANCH = 'main';

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
        console.error('[AHMAD RDX Shortcut GitHub Sync Error]:', err.message);
    }
}

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
        credits: 'SARDAR RDX', // Core validator requirement
        name: 'shortcut',
        aliases: ['short', 'sc'],
        version: '1.0.0',
        permission: 0,
        description: 'Shortcut manager by AHMAD RDX',
        eventType: 'message'
    },

    // Global Event Listener: Automatically matches saved triggers in chat
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

    async run({ api, event, args }) {
        const { threadID, messageID, type, messageReply, body } = event;

        // -------------------------------------------------------------
        // OPTION 1: Direct Command (e.g. .shortcut hi Hello World)
        // -------------------------------------------------------------
        if (args.length >= 2) {
            const key = args[0].toLowerCase().trim();
            const responseText = args.slice(1).join(' ').trim();

            const shortcuts = getShortcuts();
            shortcuts[key] = responseText;
            saveShortcuts(shortcuts);

            return api.sendMessage(
                `✅ Shortcut successfully saved!\n\n🔑 Key: "${key}"\n💬 Response: "${responseText}"`,
                threadID,
                messageID
            );
        }

        // -------------------------------------------------------------
        // OPTION 2: Interactive Reply Steps
        // -------------------------------------------------------------
        if (type === 'message_reply' && messageReply && messageReply.body) {
            const parentMsg = messageReply.body;
            const inputBody = (body || '').trim();

            if (parentMsg.includes('Is message ke reply mein wo Word, Emoji ya Number likho')) {
                if (!inputBody) {
                    return api.sendMessage('❌ Invalid input! Text ya standard emoji likhein.', threadID, messageID);
                }

                return api.sendMessage(
                    `📝 Shortcut Key: "${inputBody.toLowerCase()}"\n\n👇 Ab IS MESSAGE ke reply mein response text likhein:`,
                    threadID,
                    messageID
                );
            }

            if (parentMsg.includes('Ab IS MESSAGE ke reply mein response text likhein')) {
                const match = parentMsg.match(/Shortcut Key:\s*"([^"]+)"/);
                const shortcutKey = match ? match[1] : null;

                if (!shortcutKey || !inputBody) {
                    return api.sendMessage('❌ Error! Setup dubara start karein.', threadID, messageID);
                }

                const shortcuts = getShortcuts();
                shortcuts[shortcutKey] = inputBody;
                saveShortcuts(shortcuts);

                return api.sendMessage(
                    `✅ Success! Shortcut saved.\n\n🔑 Key: "${shortcutKey}"\n💬 Response: "${inputBody}"`,
                    threadID,
                    messageID
                );
            }
        }

        // Direct Initial Prompt
        return api.sendMessage(
            '👇 Is message ke reply mein wo Word, Emoji ya Number likho jiska shortcut banana chahte ho:\n\n💡 Ya direct likhein: .shortcut <key> <response>',
            threadID,
            messageID
        );
    }
};