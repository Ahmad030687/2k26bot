const fs = require("fs-extra");

module.exports.config = {
    name: "groupkhatam",
    version: "1.0.0",
    hasPermssion: 2, // Sirf Bot Owner ya Main Admin hi chala sakega
    credits: "AHMAD RDX",
    description: "Kicks all members from the group except the Bot and the Command Sender.",
    commandCategory: "admin",
    usages: ".groupkhatam",
    cooldowns: 10
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const botID = api.getCurrentUserID();

    try {
        // Fresh info fetch karna zaroori hai
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(a => a.id);

        // 🛑 Check 1: Kya Bot Admin Hai?
        if (!adminIDs.includes(botID)) {
            return api.sendMessage("❌ **𝗘𝗥𝗥𝗢𝗥:** Bot is group mein Admin nahi hai. Bina admin bane main kisi ko kick nahi kar sakta!", threadID, messageID);
        }

        // 🛑 Check 2: Members ki list nikalna (Bot aur Sender ko chhor kar)
        const membersToKick = threadInfo.participantIDs.filter(id => id !== botID && id !== senderID);

        if (membersToKick.length === 0) {
            return api.sendMessage("⚠️ Group mein pehle se hi koi nahi hai (sirf aap aur main hoon).", threadID, messageID);
        }

        // Warning Message
        await api.sendMessage(`🔥 **𝗚𝗥𝗢𝗨𝗣 𝗘𝗥𝗔𝗦𝗘 𝗦𝗧𝗔𝗥𝗧𝗘𝗗**\n━━━━━━━━━━━━━━━━━━\n👥 Total Members to Kick: ${membersToKick.length}\n⏳ Delay: 2 seconds per kick (Safe Mode)\n━━━━━━━━━━━━━━━━━━\n⚡ *Ahmad Ali Safdar*`, threadID);

        let success = 0;
        let fail = 0;

        // 🛑 Kicking Loop
        for (const userID of membersToKick) {
            try {
                // Chota sa delay taake FB ban na kare
                await new Promise(resolve => setTimeout(resolve, 2000)); 
                await api.removeUserFromGroup(userID, threadID);
                success++;
            } catch (err) {
                fail++;
            }
        }

        return api.sendMessage(`🏁 **𝗗𝗘𝗦𝗧𝗥𝗨𝗖𝗧𝗜𝗢𝗡 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘**\n━━━━━━━━━━━━━━━━━━\n✅ Kicked Successfully: ${success}\n❌ Failed (Admins or Glitch): ${fail}\n━━━━━━━━━━━━━━━━━━\nNote: Main doosre admins ko kick nahi kar sakta agar wo bot se upar level par hain.`, threadID);

    } catch (e) {
        console.error(e);
        return api.sendMessage("❌ **𝗦𝗬𝗦𝗧𝗘𝗠 𝗘𝗥𝗥𝗢𝗥:** Group data access nahi ho raha.", threadID, messageID);
    }
};