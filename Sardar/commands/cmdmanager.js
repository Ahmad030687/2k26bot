/**
 * Command Manager (.addcmd & .editcmd)
 * Path: Sardar/commands/cmdmanager.js
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const commandsDir = path.join(__dirname);

// Environment Variable or Hardcoded Fallback
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

module.exports = {
    config: {
        credits: 'SARDAR RDX',
        name: 'cmdmanager',
        aliases: ['addcmd', 'editcmd', 'cmd'],
        version: '1.0.0',
        permission: 2,
        description: 'Dynamically add and edit commands in Sardar/commands by AHMAD RDX'
    },

    async run({ api, event, args }) {
        const { threadID, messageID, body, type, messageReply } = event;
        const input = args[0] ? args[0].toLowerCase().trim() : '';

        const isAdd = body.toLowerCase().startsWith('.addcmd');
        const isEdit = body.toLowerCase().startsWith('.editcmd') || body.toLowerCase().startsWith('.cmd');

        // =============================================================
        // HANDLE REPLY FOR EDIT OR ADD
        // =============================================================
        if (type === 'message_reply' && messageReply && messageReply.body) {
            const parentText = messageReply.body;
            
            // Edit Case: User replied to bot's old code display message
            if (parentText.includes('Existing code for "') || parentText.includes('⚠️ Is message ke reply')) {
                const match = parentText.match(/Existing code for "([^"]+)"/);
                const fileName = match ? match[1] : (input ? (input.endsWith('.js') ? input : `${input}.js`) : null);

                if (!fileName) {
                    return api.sendMessage('❌ Command filename detect nahi ho saka. Standard syntax use karein.', threadID, messageID);
                }

                const localFilePath = path.join(commandsDir, fileName);
                const githubPath = `Sardar/commands/${fileName}`;
                const newCodeContent = body.trim();

                try {
                    // Local Save and Reload
                    await fs.writeFile(localFilePath, newCodeContent, 'utf8');

                    if (require.cache[require.resolve(localFilePath)]) {
                        delete require.cache[require.resolve(localFilePath)];
                    }
                    require(localFilePath);

                    // GitHub Sync
                    const sha = await getGithubFileSha(githubPath);
                    const ghSynced = await pushToGithub(githubPath, newCodeContent, `Update command: Sardar/commands/${fileName} via AHMAD RDX`, sha);

                    const statusMsg = ghSynced 
                        ? `🔄 Command "${fileName}" update ho gaya, GitHub par sync ho gaya aur reload ho gaya!` 
                        : `🔄 Command "${fileName}" local update aur reload ho gaya! (GitHub Token issue).`;

                    return api.sendMessage(statusMsg, threadID, messageID);

                } catch (err) {
                    console.error('[AHMAD RDX CmdManager Edit Reply Error]:', err);
                    return api.sendMessage(`❌ Failed to edit command: ${err.message}`, threadID, messageID);
                }
            }

            // Add Case: User replied to raw code with .addcmd <cmdName>
            if (isAdd && input) {
                const fileName = input.endsWith('.js') ? input : `${input}.js`;
                const localFilePath = path.join(commandsDir, fileName);
                const githubPath = `Sardar/commands/${fileName}`;
                const codeContent = messageReply.body.trim();

                try {
                    await fs.writeFile(localFilePath, codeContent, 'utf8');

                    if (require.cache[require.resolve(localFilePath)]) {
                        delete require.cache[require.resolve(localFilePath)];
                    }
                    require(localFilePath);

                    const sha = await getGithubFileSha(githubPath);
                    const ghSynced = await pushToGithub(githubPath, codeContent, `Add command: Sardar/commands/${fileName} via AHMAD RDX`, sha);

                    const statusMsg = ghSynced 
                        ? `✅ Command "${fileName}" create ho gaya, GitHub par sync ho gaya aur Bot mein load ho gaya!` 
                        : `⚠️ Command "${fileName}" bot mein load ho gaya hai, lekin GitHub par save nahi ho saka.`;

                    return api.sendMessage(statusMsg, threadID, messageID);

                } catch (err) {
                    console.error('[AHMAD RDX CmdManager Add Reply Error]:', err);
                    return api.sendMessage(`❌ Failed to add command: ${err.message}`, threadID, messageID);
                }
            }
        }

        // =============================================================
        // DIRECT INITIAL CALLS (.editcmd <cmdName>)
        // =============================================================
        if (!input) {
            return api.sendMessage(
                '❌ Usage:\n1. Code waale msg par REPLY karke `.addcmd <cmdName>` likhein.\n2. `.editcmd <cmdName>` (Old code aayega, reply mein new code paste karein)',
                threadID,
                messageID
            );
        }

        const cmdName = input.endsWith('.js') ? input.slice(0, -3) : input;
        const fileName = `${cmdName}.js`;
        const localFilePath = path.join(commandsDir, fileName);

        if (isEdit) {
            if (!fs.existsSync(localFilePath)) {
                return api.sendMessage(`❌ File "Sardar/commands/${fileName}" nahi mili.`, threadID, messageID);
            }

            try {
                const oldCode = await fs.readFile(localFilePath, 'utf8');
                return api.sendMessage(
                    `📜 Existing code for "${fileName}":\n\n\`\`\`javascript\n${oldCode}\n\`\`\`\n\n⚠️ Is message ke reply mein NAYA code paste karein update karne ke liye!`,
                    threadID,
                    messageID
                );
            } catch (err) {
                return api.sendMessage(`❌ File read error: ${err.message}`, threadID, messageID);
            }
        }
    }
};
