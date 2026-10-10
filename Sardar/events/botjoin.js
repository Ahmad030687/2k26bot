const fs = require('fs-extra');
const path = require('path');

const VIDEO_PATH = path.join(__dirname, 'cache', 'botjoin.mp4');

module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'botjoin',
        eventType: 'log:subscribe',
        description: 'Set bot nickname and send welcome video when bot is added to group'
    },

    async run({ api, event, Threads, config }) {
        const { threadID, logMessageData } = event;
        const addedParticipants = logMessageData?.addedParticipants || [];
        const botID = api.getCurrentUserID();

        const botJoined = addedParticipants.some(p => p.userFbId === botID);
        if (!botJoined) return;

        try {
            const settings = Threads.getSettings(threadID);
            const botNickname = settings?.botNickname || config.BOTNICKNAME || config.BOTNAME || 'RDX Bot';

            try { await api.changeNickname(botNickname, threadID, botID); } catch {}

            const welcomeMsg =
                `✦ ━━━━━━━━━━━━━━━━━━━━━━ ✦\n` +
                `\n` +
                `🎉  𝑾𝑬𝑳𝑪𝑶𝑴𝑬  𝑻𝑶  𝑻𝑯𝑬  𝑮𝑹𝑶𝑼𝑷  🎉\n` +
                `\n` +
                `✦ ━━━━━━━━━━━━━━━━━━━━━━ ✦\n` +
                `\n` +
                `👋  Hello Everyone! I'm ${config.BOTNAME || 'RDX Bot'}\n` +
                `🤖  Your new group assistant is here!\n` +
                `\n` +
                `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                `\n` +
                `💡  Type  ${config.PREFIX || '.'}help  for all commands\n` +
                `🎀  𝑬𝒏𝒋𝒐𝒚! 𝑨𝒂𝒑 𝒌𝒂 𝒔𝒘𝒂𝒈𝒂𝒕 𝒉𝒂𝒊! 🌸\n` +
                `\n` +
                `✦ ━━━━━━━━━━━━━━━━━━━━━━ ✦\n` +
                `🤖  𝗣𝗼𝘄𝗲𝗿𝗲𝗱  𝗯𝘆  𝗔𝗛𝗠𝗔𝗗  𝗥𝗗𝗫  𝗕𝗢𝗧`;

            try {
                if (fs.existsSync(VIDEO_PATH)) {
                    await api.sendMessage(
                        { body: welcomeMsg, attachment: fs.createReadStream(VIDEO_PATH) },
                        threadID
                    );
                } else {
                    await api.sendMessage(welcomeMsg, threadID);
                }
            } catch {
                try { await api.sendMessage(welcomeMsg, threadID); } catch {}
            }

        } catch (e) {
            console.log('[botjoin] Error:', e.message);
        }
    }
};
