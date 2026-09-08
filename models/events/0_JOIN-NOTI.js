const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.1.0",
    credits: "AHMAD RDX",
    description: "Welcome Notification with Superban Protection",
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function({ api, event }) {
    const { threadID } = event;
    const pathBan = path.join(__dirname, "../commands/cache/blacklist.json");

    // --- 🛡️ STEP 0: BLACKLIST CHECK (Makkhan Kick) ---
    if (fs.existsSync(pathBan)) {
        const blacklist = fs.readJsonSync(pathBan);
        const addedParticipants = event.logMessageData.addedParticipants;

        for (let user of addedParticipants) {
            if (blacklist[user.userFbId]) {
                // User blacklist mein hai, foran kick karo
                api.removeUserFromGroup(user.userFbId, threadID);
                return api.sendMessage(`『 𝗔𝗛𝗠𝗔𝗗 𝗥𝗗𝗫 🛡️ 』\n\n🚫 **DETECTED:** Blacklisted user detected.\n🛡️ **ACTION:** Permanently Kicked!\n⚠️ **NOTE:** Is ID ko bot admin ne superban kiya hua hai.`, threadID);
            }
        }
    }

    // --- 🤖 CASE 1: Bot Joined ---
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`{ ${global.config.PREFIX} } × ${(!global.config.BOTNAME) ? "bot" : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
        return api.sendMessage(`🌺 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 🌺\nType ${global.config.PREFIX}help to see commands.`, threadID);
    }

    // --- 👤 CASE 2: Member Joined (Welcome) ---
    try {
        let threadInfo = await api.getThreadInfo(threadID);
        let threadName = threadInfo.threadName || "the group";
        const addedParticipants = event.logMessageData.addedParticipants;

        for (let newParticipant of addedParticipants) {
            const userName = newParticipant.fullName;
            // Welcome message tabhi ayega agar banda blacklist mein nahi tha
            let msg = `👋 ${userName} has joined ${threadName}.`;
            return api.sendMessage(msg, threadID);
        }
    } catch (e) {
        console.log("JoinNoti Error: ", e);
    }
};
