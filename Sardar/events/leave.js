const axios = require('axios');
const moment = require('moment-timezone');
const os = require('os');

const LEAVE_GIFS = [
    'https://i.ibb.co/d4G08M8d/342059a07400.gif',
    'https://i.ibb.co/cSNz3rdk/aa6428702cc9.gif'
];

module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'leave',
        eventType: 'log:unsubscribe',
        description: 'Stylish goodbye message with GIF when member leaves'
    },

    async run({ api, event, send, Users, Threads, config }) {
        const { threadID, logMessageData } = event;
        const botID = api.getCurrentUserID();
        const leftParticipantFbId = logMessageData?.leftParticipantFbId;
        const leftParticipants = logMessageData?.leftParticipants || (leftParticipantFbId ? [{ userFbId: leftParticipantFbId }] : []);

        const notifyTid = config.NOTIFY_TID;
        const time = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('hh:mm:ss A');
        const date = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('DD/MM/YYYY');

        for (const member of leftParticipants) {
            const uid = member.userFbId || member.userFbId;

            if (String(uid) === String(botID)) {
                if (!notifyTid) continue;

                let groupName = 'Unknown Group';
                try {
                    const cached = await Threads.get(threadID);
                    if (cached?.name) {
                        groupName = cached.name;
                    } else {
                        const info = await Threads.getInfo(threadID);
                        groupName = info?.threadName || info?.name || 'Unknown Group';
                    }
                } catch {}

                const getRealUptime = require('../../controller/utility/getRealUptime');
                const uptime = getRealUptime();
                const h = Math.floor(uptime / 3600);
                const m = Math.floor((uptime % 3600) / 60);
                const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
                const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);
                const wasKicked = logMessageData?.leftParticipants?.some?.(p => p.leftBy && String(p.leftBy) !== String(botID));
                const action = wasKicked ? '👢 BOT KICKED' : '🚪 BOT LEFT';

                try {
                    await api.sendMessage(
                        `╔══〔 🔴 ${action} 〕══╗\n\n` +
                        `🏠 𝐆𝐫𝐨𝐮𝐩  : ${groupName}\n` +
                        `🆔 𝐓𝐈𝐃    : ${threadID}\n` +
                        `📅 𝐃𝐚𝐭𝐞   : ${date}\n` +
                        `🕐 𝐓𝐢𝐦𝐞   : ${time}\n\n` +
                        `📊 𝐁𝐨𝐭 𝐇𝐞𝐚𝐥𝐭𝐡\n` +
                        `⏱️ Uptime : ${h}h ${m}m\n` +
                        `💾 RAM    : ${ram}/${totalRam} MB\n\n` +
                        `👑 AHMAD RDX BOT`,
                        notifyTid
                    );
                } catch {}
                continue;
            }

            const settings = await Threads.getSettings(threadID).catch(() => ({}));
            let name = member.fullName || 'Member';
            try {
                if (!member.fullName) {
                    const info = await api.getUserInfo(uid);
                    name = info[uid]?.name || 'Member';
                }
            } catch {}

            if (settings?.antiout) {
                try {
                    await api.addUserToGroup(uid, threadID);
                    return api.sendMessage(
                        `╔══〔 🔒 𝐀𝐍𝐓𝐈-𝐎𝐔𝐓 〕══╗\n\n` +
                        `👤 ${name} wapas add kar diya!\n` +
                        `⛓️ Is group se nikalna allowed nahi!\n\n` +
                        `🤖 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑨𝑯𝑴𝑨𝑫 𝑹𝑫𝑿`,
                        threadID
                    );
                } catch {}
            }

            let memberCount = 0;
            try {
                const threadInfo = await Threads.getInfo(threadID);
                memberCount = threadInfo?.participantIDs?.length || 0;
            } catch {}

            const gifPromise = axios.get(
                LEAVE_GIFS[Math.floor(Math.random() * LEAVE_GIFS.length)],
                { responseType: 'stream', timeout: 8000 }
            ).catch(() => null);

            const leaveMsg =
                `╭──〔❨✧✧❩〕──╮\n` +
                `  ✨ 𝐌𝐄𝐌𝐁𝐄𝐑 𝐋𝐄𝐅𝐓 ✨  \n` +
                `╰──〔❨✧✧❩〕──╯\n\n` +
                `💔 Sad to see you go 💔\n` +
                ` ${name} \n` +
                `${'꘏'.repeat(18)}\n\n` +
                `👋 Goodbye Member 👋\n` +
                `👤 Name: ${name}\n\n` +
                `📊 Group Statistics 📊\n` +
                `👥 Remaining: ${memberCount}\n` +
                `📅 Date: ${date}\n` +
                `🕐 Time: ${time}\n\n` +
                `💡 Hope you'll come back! 💡\n` +
                `🎉 Take care! 🎉`;

            const gif = await gifPromise;
            try {
                if (gif?.data) {
                    await api.sendMessage({ body: leaveMsg, attachment: gif.data }, threadID);
                } else {
                    await api.sendMessage(leaveMsg, threadID);
                }
            } catch {
                try { await api.sendMessage(leaveMsg, threadID); } catch {}
            }
        }
    }
};
