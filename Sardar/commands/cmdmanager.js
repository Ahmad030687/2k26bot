/**
 * Command Manager (.addcmd & .editcmd)
 * Path: Sardar/commands/cmdmanager.js
 * Instant Direct Code Acceptor Engine (No Reply Needed)
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const commandsDir = path.join(__dirname);

// GitHub Credentials
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const GITHUB_REPO = 'Ahmad030687/2k26bot';
const GITHUB_BRANCH = 'main';

async function pushToGithub(filePathInRepo, content, commitMessage, sha = null) {
    if (!GITHUB_TOKEN) return false;

    try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePathInRepo}`;
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
        return true;
    } catch (e) {
        console.error('[AHMAD RDX GitHub Sync Error]:', e.response?.data || e.message);
        return false;
    }
}

async function getGithubFileSha(filePathInRepo) {
    if (!GITHUB_TOKEN) return null;

    try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePathInRepo}?ref=${GITHUB_BRANCH}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AHMAD-RDX-Bot'
            }
        });
        return response.data.sha;
    } catch (e) {
        return null;
    }
}

function registerCommandToBot(localFilePath) {
    try {
        if (require.cache[require.resolve(localFilePath)]) {
            delete require.cache[require.resolve(localFilePath)];
        }
        const pull = require(localFilePath);

        global.client = global.client || {};
        global.client.commands = global.client.commands || new Map();
        global.client.aliases = global.client.aliases || new Map();
        global.client.handleEvent = global.client.handleEvent || [];

        if (pull.config && pull.config.name) {
            const cmdName = pull.config.name.toLowerCase();
            global.client.commands.set(cmdName, pull);

            if (pull.config.aliases && Array.isArray(pull.config.aliases)) {
                pull.config.aliases.forEach(alias => {
                    global.client.aliases.set(alias.toLowerCase(), cmdName);
                });
            }

            if (typeof pull.handleEvent === 'function') {
                global.client.handleEvent = global.client.handleEvent.filter(item => item.config.name !== pull.config.name);
                global.client.handleEvent.push(pull);
            }
            return true;
        }
    } catch (err) {
        console.error('[AHMAD RDX Load Error]:', err.message);
    }
    return false;
}

module.exports = {
    config: {
        credits: 'SARDAR RDX',
        name: 'cmdmanager',
        aliases: ['addcmd', 'editcmd', 'cmd', 'load'],
        version: '2.0.0',
        permission: 2,
        description: 'Direct Add, Edit & Reload commands in Sardar/commands by AHMAD RDX'
    },

    async run({ api, event, args }) {
        const { threadID, messageID, body, type, messageReply } = event;
        const cleanBody = body.trim();
        const input = args[0] ? args[0].toLowerCase().trim() : '';

        // -------------------------------------------------------------
        // METHOD 1: Direct Message Call (Command Name + Code in same message)
        // Example: .editcmd shortcut /** code here **/
        // -------------------------------------------------------------
        if (args.length >= 2) {
            const cmdName = input.endsWith('.js') ? input.slice(0, -3) : input;
            const fileName = `${cmdName}.js`;
            const localFilePath = path.join(commandsDir, fileName);
            const githubPath = `Sardar/commands/${fileName}`;

            // Command name ke baad wala poora text code count hoga
            const codeContent = cleanBody.substring(cleanBody.indexOf(args[1])).trim();

            try {
                await fs.writeFile(localFilePath, codeContent, 'utf8');
                const loaded = registerCommandToBot(localFilePath);

                if (!loaded) {
                    return api.sendMessage(`❌ Code mein syntax error hai! Active load nahi ho saka.`, threadID, messageID);
                }

                const sha = await getGithubFileSha(githubPath);
                const ghSynced = await pushToGithub(githubPath, codeContent, `Update ${fileName} via AHMAD RDX`, sha);

                const statusMsg = ghSynced 
                    ? `✅ Command "${fileName}" direct save, GitHub sync aur memory mein load ho gaya!` 
                    : `⚠️ Command "${fileName}" local active ho gaya (GitHub sync pending).`;

                return api.sendMessage(statusMsg, threadID, messageID);

            } catch (err) {
                return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
            }
        }

        // -------------------------------------------------------------
        // METHOD 2: Message Reply Method (Agar direct code na ho)
        // -------------------------------------------------------------
        if (type === 'message_reply' && messageReply && messageReply.body && input) {
            const cmdName = input.endsWith('.js') ? input.slice(0, -3) : input;
            const fileName = `${cmdName}.js`;
            const localFilePath = path.join(commandsDir, fileName);
            const githubPath = `Sardar/commands/${fileName}`;
            const codeContent = messageReply.body.trim();

            try {
                await fs.writeFile(localFilePath, codeContent, 'utf8');
                registerCommandToBot(localFilePath);

                const sha = await getGithubFileSha(githubPath);
                await pushToGithub(githubPath, codeContent, `Save ${fileName} via AHMAD RDX`, sha);

                return api.sendMessage(`✅ Command "${fileName}" reply se save aur active ho gaya!`, threadID, messageID);
            } catch (err) {
                return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
            }
        }

        // -------------------------------------------------------------
        // METHOD 3: Direct Read/Fetch Existing Code
        // -------------------------------------------------------------
        if (input && args.length === 1) {
            const cmdName = input.endsWith('.js') ? input.slice(0, -3) : input;
            const fileName = `${cmdName}.js`;
            const localFilePath = path.join(commandsDir, fileName);

            if (!fs.existsSync(localFilePath)) {
                return api.sendMessage(`❌ File "Sardar/commands/${fileName}" nahi mili.`, threadID, messageID);
            }

            try {
                const oldCode = await fs.readFile(localFilePath, 'utf8');
                return api.sendMessage(`📜 Existing Code for "${fileName}":\n\n\`\`\`javascript\n${oldCode}\n\`\`\``, threadID, messageID);
            } catch (err) {
                return api.sendMessage(`❌ Read Error: ${err.message}`, threadID, messageID);
            }
        }

        return api.sendMessage('❌ Usage:\n.editcmd shortcut <POORA_CODE_PASTE_KAREIN>', threadID, messageID);
    }
};
