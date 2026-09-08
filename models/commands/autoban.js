module.exports.config = {
    name: "autoban",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Check Auto Ban Status",
    commandCategory: "system",
    usages: "",
    cooldowns: 5
};

// Ye variables wahi use karo jo events file mein hain
// Ya alag se status file se padho

module.exports.run = async function({ api, event }) {
    const { threadID, senderID } = event;
    
    let name = "User";
    try {
        const info = await api.getUserInfo(senderID);
        name = info[senderID]?.name || "User";
    } catch(e) {}

    let msg = `🛡️ **AHMAD RDX AUTO BAN SYSTEM** 🛡️\n\n`;
    msg += `👤 ${name}\n\n`;
    msg += `📋 **Rules:**\n`;
    msg += `🔹 5 msgs in 1 min = ⚠️ Warning\n`;
    msg += `🔹 Warning = 🔇 5 min ignore\n`;
    msg += `🔹 3 Warnings = 🔨 1 Hour BAN\n\n`;
    msg += `⚠️ **Admins are EXEMPT!**\n\n`;
    msg += `✨ Branded by **AHMAD RDX** ✨\n`;
    msg += `💀 Spam karne walo ki khair nahi!`;
    
    return api.sendMessage(msg, threadID);
};