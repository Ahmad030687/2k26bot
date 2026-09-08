module.exports.config = {
    name: "thread",
    version: "5.0.0",
    hasPermssion: 2,
    credits: "Ahmad RDX", // Fully automated without ID or listen.js edits
    description: "Unban or Ban groups via Auto-List and Reply",
    commandCategory: "system",
    usages: "[ban/unban]",
    cooldowns: 2
};

module.exports.run = async ({ event, api, args, Threads }) => { 
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();

    // ========== BAN CURRENT GROUP ==========
    if (action === "ban" || action === "-b") {
        const targetID = String(threadID);
        if (!global.data.allThreadID.includes(targetID)) {
            return api.sendMessage("❌ Ye group database mein nahi hai!", threadID, messageID);
        }
        if (global.data.threadBanned.has(targetID)) {
            return api.sendMessage("⚠️ Ye group pehle se BAN hai!", threadID, messageID);
        }

        return api.sendMessage(
            "⚠️ Kya aap REALLY is group ko BAN karna chahte hain?\n\n✅ React karein confirm karne ke liye!",
            threadID,
            (error, info) => {
                global.client.handleReaction.push({
                    type: "ban",
                    targetID,
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID
                });
            },
            messageID
        );
    }

    // ========== SMART UNBAN WITHOUT ID ==========
    if (action === "unban" || action === "-ub") {
        const bannedThreads = Array.from(global.data.threadBanned.keys());

        if (bannedThreads.length === 0) {
            return api.sendMessage("❌ Is waqt koi bhi group BAN nahi hai!", threadID, messageID);
        }

        // Case 1: Agar sirf 1 hi group ban hai toh auto-detect karega
        if (bannedThreads.length === 1) {
            const targetID = bannedThreads[0];
            let name = "Unknown Group";
            try {
                let threadInfo = await Threads.getInfo(targetID);
                name = threadInfo.threadName || "Unknown Group";
            } catch (e) {}

            return api.sendMessage(
                `🌸 Is waqt database mein sirf ek hi group BAN mila:\n\n🏰 𝗚𝗿𝗼𝘂𝗽: ${name}\n🆔 𝗜𝗗: ${targetID}\n\n✅ Isay UNBAN karne ke liye is message par REACT karein!`,
                threadID,
                (error, info) => {
                    global.client.handleReaction.push({
                        type: "unban",
                        targetID,
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID
                    });
                },
                messageID
            );
        } 
        
        // Case 2: Agar ek se zyada groups ban hain toh list dikhaye ga
        else {
            let msg = "👑 𝐁𝐀𝐍𝐍𝐄𝐃 𝐆𝐑𝐎𝐔𝐏𝐒 𝐋𝐈𝐒𝐓 👑\n━━━━━━━━━━━━━━━━━\n";
            for (let i = 0; i < bannedThreads.length; i++) {
                let name = "Unknown Group";
                try {
                    let threadInfo = await Threads.getInfo(bannedThreads[i]);
                    name = threadInfo.threadName || "Unknown Group";
                } catch (e) {}
                msg += `${i + 1}. 🏰 ${name}\n   🆔 ID: ${bannedThreads[i]}\n\n`;
            }
            msg += "━━━━━━━━━━━━━━━━━\n👉 Jis group ko unban karna hai, is message ka REPLY karein aur sirf uska Serial Number (e.g. 1) likhein!";

            return api.sendMessage(msg, threadID, (error, info) => {
                global.client.handleReply.push({
                    type: "select_unban",
                    name: this.config.name,
                    messageID: info.messageID,
                    bannedThreads,
                    author: senderID
                });
            }, messageID);
        }
    }

    // ========== INVALID USAGE ==========
    return api.sendMessage(
        "📌 𝐔𝐒𝐀𝐆𝐄:\n\n" +
        "🔹 .thread ban   → Current group BAN kare\n" +
        "🔹 .thread unban → Banned groups ki list check/unban karein (Run from DM/Other Group)",
        threadID,
        messageID
    );
};

// ================= HANDLE REACTION (For Ban & Auto-Unban) =================
module.exports.handleReaction = async ({ event, api, Threads, handleReaction }) => {
    if (String(event.userID) !== String(handleReaction.author)) return;
    
    const { threadID } = event;
    const { messageID, type, targetID } = handleReaction;

    global.client.handleReaction.splice(
        global.client.handleReaction.findIndex(item => item.messageID == messageID),
        1
    );

    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    if (type === "ban") {
        try {
            let data = (await Threads.getData(targetID)).data || {};
            data.banned = true;
            data.reason = "Banned by Admin";
            data.dateAdded = time;
            await Threads.setData(targetID, { data });
            global.data.threadBanned.set(targetID, { reason: data.reason, dateAdded: data.dateAdded });
            
            api.unsendMessage(messageID);
            return api.sendMessage("✅ Group BAN ho gaya!", threadID);
        } catch (e) {
            return api.sendMessage("❌ Ban karne mein error aaya!", threadID);
        }
    }

    if (type === "unban") {
        try {
            let data = (await Threads.getData(targetID)).data || {};
            data.banned = false;
            data.reason = null;
            data.dateAdded = null;
            await Threads.setData(targetID, { data });
            global.data.threadBanned.delete(targetID);
            
            api.unsendMessage(messageID);
            return api.sendMessage("🌸 Group kamyabi se UNBAN ho gaya! Ab bot wapas chalega.", threadID);
        } catch (e) {
            return api.sendMessage("❌ Unban karne mein error aaya!", threadID);
        }
    }
};

// ================= HANDLE REPLY (For List Selection) =================
module.exports.handleReply = async ({ event, api, Threads, handleReply }) => {
    if (String(event.senderID) !== String(handleReply.author)) return;
    const { threadID, messageID, body } = event;
    const { type, bannedThreads } = handleReply;

    if (type === "select_unban") {
        const index = parseInt(body.trim()) - 1;
        if (isNaN(index) || index < 0 || index >= bannedThreads.length) {
            return api.sendMessage("❌ Galat number likha hai! Sahi serial number reply karein.", threadID, messageID);
        }

        const targetID = bannedThreads[index];

        try {
            let data = (await Threads.getData(targetID)).data || {};
            data.banned = false;
            data.reason = null;
            data.dateAdded = null;
            await Threads.setData(targetID, { data });
            global.data.threadBanned.delete(targetID);

            api.unsendMessage(handleReply.messageID);
            return api.sendMessage(`🌸 Group (ID: ${targetID}) kamyabi se UNBAN ho gaya hai!`, threadID, messageID);
        } catch (e) {
            console.log(e);
            return api.sendMessage("❌ Unban karne mein koi masla aaya!", threadID, messageID);
        }
    }
};
