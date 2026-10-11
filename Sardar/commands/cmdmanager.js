/**
 * Command Manager (.addcmd & .editcmd)
 * Path: Sardar/commands/cmdmanager.js
 * Hardcoded GitHub Credentials & Auto-Reload Engine
 * Powered by AHMAD RDX
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const commandsDir = path.join(__dirname); // Sardar/commands directory

// Hardcoded GitHub Configuration
const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'Ahmad030687/2k26bot';
const GITHUB_BRANCH = 'main';

// Helper: Push/Commit file directly to GitHub repository
async function pushToGithub(filePathInRepo, content, commitMessage, sha = null) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePathInRepo}`;
    const payload = {
        message: commitMessage,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: GITHUB_BRANCH
    };
    if (sha) payload.sha = sha;

    const response = await axios.put(url, payload, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AHMAD-RDX-Bot'
        }
    });

    return response.data;
}

// Helper: Fetch existing GitHub file SHA
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
        credits: 'SARDAR RDX', // Core validator protection (Safe format)
        name: 'cmdmanager',
        aliases: ['addcmd', 'editcmd', 'cmd'], // Aliases add kar diye hain taake .editcmd work kare
        version: '1.0.0',
        permission: 2, // Admin only
        description: 'Dynamically add and edit commands in Sardar/commands with hardcoded GitHub sync'
    },

    async run({ api, event, args }) {
        const { threadID, messageID, body, type, messageReply } = event;
        const input = args[0] ? args[0].toLowerCase().trim() : '';

        if (!input) {
            return api.sendMessage(
                '❌ Usage:\n1. .addcmd <cmdName> (Reply mein JS code paste karein)\n2. .editcmd <cmdName> (Old code aayega, reply mein new code paste karein)',
                threadID,
                messageID
            );
        }

        // Automatic .js extension handler
        const cmdName = input.endsWith('.js') ? input.slice(0, -3) : input;
        const fileName = `${cmdName}.js`;
        const localFilePath = path.join(commandsDir, fileName);
        const githubPath = `Sardar/commands/${fileName}`; // Exact path in GitHub repo

        const isAdd = body.toLowerCase().startsWith('.addcmd');
        const isEdit = body.toLowerCase().startsWith('.editcmd');

        // =============================================================
        // WORKFLOW 1: .addcmd <command_name>
        // =============================================================
        if (isAdd) {
            if (type !== 'message_reply' || !messageReply || !messageReply.body) {
                return api.sendMessage(
                    `📝 Naya command code message ke reply mein paste karein:\nSyntax: .addcmd ${cmdName}`,
                    threadID,
                    messageID
                );
            }

            const codeContent = messageReply.body.trim();

            try {
                // 1. Local file Sardar/commands/ mein write karein
                await fs.writeFile(localFilePath, codeContent, 'utf8');

                // 2. Cache clear karke module reload karein
                if (require.cache[require.resolve(localFilePath)]) {
                    delete require.cache[require.resolve(localFilePath)];
                }
                require(localFilePath);

                // 3. GitHub repository par push/commit karein
                const existingSha = await getGithubFileSha(githubPath);
                await pushToGithub(githubPath, codeContent, `Add command: Sardar/commands/${fileName} via AHMAD RDX`, existingSha);

                return api.sendMessage(
                    `✅ Command "${fileName}" Sardar/commands/ mein create, GitHub repo (Ahmad030687/2k26bot) par commit, aur bot mein auto-load ho gaya!`,
                    threadID,
                    messageID
                );

            } catch (err) {
                console.error('[AHMAD RDX CmdManager Add Error]:', err);
                return api.sendMessage(`❌ Failed to add command: ${err.message}`, threadID, messageID);
            }
        }

        // =============================================================
        // WORKFLOW 2: .editcmd <command_name>
        // =============================================================
        if (isEdit || body.toLowerCase().startsWith('.cmd')) {
            // Step A: Direct command call -> Existing code fetch karke bhejna
            if (type !== 'message_reply') {
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

            // Step B: Reply to old code message -> New code save, push & reload
            if (type === 'message_reply' && messageReply && messageReply.body) {
                const newCodeContent = body.trim();

                try {
                    // 1. Local Sardar/commands/ file update/overwrite karein
                    await fs.writeFile(localFilePath, newCodeContent, 'utf8');

                    // 2. Dynamic cache clear & reload
                    if (require.cache[require.resolve(localFilePath)]) {
                        delete require.cache[require.resolve(localFilePath)];
                    }
                    require(localFilePath);

                    // 3. GitHub repo par updated code push karein
                    const sha = await getGithubFileSha(githubPath);
                    await pushToGithub(githubPath, newCodeContent, `Update command: Sardar/commands/${fileName} via AHMAD RDX`, sha);

                    return api.sendMessage(
                        `🔄 Command "${fileName}" Sardar/commands/ mein update, GitHub sync, aur reloaded ho gaya!`,
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
            
