/**
 * Command Manager (.addcmd & .editcmd)
 * Path: Sardar/commands/cmdmanager.js
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const commandsDir = path.join(__dirname);

// Update your NEW valid GitHub Token here
const GITHUB_TOKEN = 'PASTE_YOUR_NEW_TOKEN_HERE';
const GITHUB_REPO = 'Ahmad030687/2k26bot';
const GITHUB_BRANCH = 'main';

async function pushToGithub(filePathInRepo, content, commitMessage, sha = null) {
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
        console.error('[AHMAD RDX GitHub Sync Warning]:', e.response?.data || e.message);
        return false;
    }
}

async function getGithubFileSha(filePathInRepo) {
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
        const githubPath = `Sardar/commands/${fileName}`;

        const isAdd = body.toLowerCase().startsWith('.addcmd');
        const isEdit = body.toLowerCase().startsWith('.editcmd');

        if (isAdd) {
            let codeContent = null;
            if (type === 'message_reply' && messageReply && messageReply.body) {
                codeContent = messageReply.body.trim();
            }

            if (!codeContent) {
                return api.sendMessage(
                    `📝 CODE waale message ke REPLY me likhein:\n👉 Syntax: .addcmd ${cmdName}`,
                    threadID,
                    messageID
                );
            }

            try {
                // 1. Local Save and Load (Guaranteed to work instantly)
                await fs.writeFile(localFilePath, codeContent, 'utf8');

                if (require.cache[require.resolve(localFilePath)]) {
                    delete require.cache[require.resolve(localFilePath)];
                }
                require(localFilePath);

                // 2. Sync to GitHub in background
                const sha = await getGithubFileSha(githubPath);
                const ghSynced = await pushToGithub(githubPath, codeContent, `Add command: Sardar/commands/${fileName} via AHMAD RDX`, sha);

                const statusMsg = ghSynced 
                    ? `✅ Command "${fileName}" create ho gaya, GitHub par sync ho gaya aur Bot mein load ho gaya!` 
                    : `⚠️ Command "${fileName}" bot mein load ho gaya hai, lekin GitHub Token 401 Unauthorized hone ki wajah se GitHub par save nahi ho saka. (Token update karein).`;

                return api.sendMessage(statusMsg, threadID, messageID);

            } catch (err) {
                console.error('[AHMAD RDX CmdManager Add Error]:', err);
                return api.sendMessage(`❌ Failed to add command: ${err.message}`, threadID, messageID);
            }
        }

        if (isEdit || body.toLowerCase().startsWith('.cmd')) {
            if (type !== 'message_reply') {
                if (!fs.existsSync(localFilePath)) {
                    return api.sendMessage(`❌ File "Sardar/commands/${fileName}" nahi mili.`, threadID, messageID);
                }

                try {
                    const oldCode = await fs.readFile(localFilePath, 'utf8');
                    return api.sendMessage(
                        `📜 Existing code for "${fileName}":\n\n\`\`\`javascript\n${oldCode}\n\`\`\`\n\n⚠️ Is message ke reply me NAYA code paste karein update karne ke liye!`,
                        threadID,
                        messageID
                    );
                } catch (err) {
                    return api.sendMessage(`❌ File read error: ${err.message}`, threadID, messageID);
                }
            }

            if (type === 'message_reply' && messageReply && messageReply.body) {
                const newCodeContent = body.trim();

                try {
                    await fs.writeFile(localFilePath, newCodeContent, 'utf8');

                    if (require.cache[require.resolve(localFilePath)]) {
                        delete require.cache[require.resolve(localFilePath)];
                    }
                    require(localFilePath);

                    const sha = await getGithubFileSha(githubPath);
                    await pushToGithub(githubPath, newCodeContent, `Update command: Sardar/commands/${fileName} via AHMAD RDX`, sha);

                    return api.sendMessage(
                        `🔄 Command "${fileName}" update ho gaya aur reload ho gaya!`,
                        threadID,
                        messageID
                    );

                } catch (err) {
                    console.error('[AHMAD RDX CmdManager Edit Error]:', err);
                    return api.sendMessage(`❌ Failed to edit command: ${err.message}`, threadID, messageID);
                }
            }
        }
    }
};
