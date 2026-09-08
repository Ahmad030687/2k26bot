module.exports.config = {
    name: "autoban",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "message", "message_reaction", "message_reply", "message_unsend"],
    version: "1.0.0",
    credits: "Ahmad RDX"
};

// ========== DATA STORAGE ==========
const spamData = {};
const warningData = {};
const bannedUsers = {};
const ignoreUntil = {};

module.exports.run = async function({ api, event }) {
    // Sirf messages handle karo
    if (!event.body) return;
    if (!event.senderID) return;
    if (event.senderID === api.getCurrentUserID()) return;
    
    const { senderID, threadID, messageID, body } = event;
    const admins = global.config.ADMINBOT || [];
    
    // Admin exempt
    if (admins.includes(senderID) || admins.includes(String(senderID))) return;
    
    const now = Date.now();

    // ===== 1. CHECK IF BANNED =====
    if (bannedUsers[senderID]) {
        const ban = bannedUsers[senderID];
        if (ban.permanent || now < ban.until) {
            try { api.unsendMessage(messageID); } catch(e) {}
            return;
        } else {
            // Unban
            delete bannedUsers[senderID];
            delete warningData[senderID];
            delete spamData[senderID];
            api.sendMessage(`✅ **AHMAD RDX**\n\nTumhara ban khatam hua! Ab sudhar jao! 😡`, threadID);
        }
    }

    // ===== 2. CHECK IF IGNORED =====
    if (ignoreUntil[senderID] && now < ignoreUntil[senderID]) {
        try { api.unsendMessage(messageID); } catch(e) {}
        return;
    }

    // ===== 3. SPAM DETECTION =====
    if (!spamData[senderID]) spamData[senderID] = [];
    
    spamData[senderID].push(now);
    
    // Sirf last 60 seconds ke messages rakho
    spamData[senderID] = spamData[senderID].filter(t => now - t < 60000);

    // ===== 4. AGAR 5 MESSAGES HO GAYE =====
    if (spamData[senderID].length >= 5) {
        spamData[senderID] = []; // Reset
        
        warningData[senderID] = (warningData[senderID] || 0) + 1;
        const warns = warningData[senderID];

        // Get user name
        let name = "User";
        try {
            const info = await api.getUserInfo(senderID);
            name = info[senderID]?.name || "User";
        } catch(e) {}

        if (warns === 1) {
            ignoreUntil[senderID] = now + 300000; // 5 min
            api.sendMessage(
                `⚠️ **AHMAD RDX WARNING [1/3]** ⚠️\n\n👤 ${name}\n📩 5 msgs in 1 minute\n⏳ Punishment: 5 mins ignore\n\nSambhal ja! 😡`,
                threadID
            );
        }
        else if (warns === 2) {
            ignoreUntil[senderID] = now + 300000; // 5 min
            api.sendMessage(
                `⚡ **AHMAD RDX WARNING [2/3]** ⚡\n\n👤 ${name}\n📩 Phir se spam!\n⏳ Punishment: 5 mins ignore\n\nLAST WARNING! Agli baar BAN! 😈`,
                threadID
            );
        }
        else if (warns >= 3) {
            // BAN
            bannedUsers[senderID] = {
                name: name,
                until: now + 3600000, // 1 hour
                permanent: false,
                when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            };
            
            delete spamData[senderID];
            delete warningData[senderID];
            delete ignoreUntil[senderID];
            
            api.sendMessage(
                `🔨 **AHMAD RDX BAN HAMMER** 🔨\n\n👤 ${name}\n🚫 BANNED!\n⏰ Duration: 1 Hour\n📋 Reason: 3 Spam Warnings\n\n✨ Branded by AHMAD RDX ✨\n\nGaya tera kaam! Nikal! 🤣`,
                threadID
            );
            
            // Admin ko notify karo
            for (let adminID of admins) {
                try {
                    api.sendMessage(
                        `🔔 **BAN ALERT**\n\n👤 ${name}\n🆔 ${senderID}\n🚫 Auto-Banned for spam\n⏰ 1 Hour Ban`,
                        adminID
                    );
                } catch(e) {}
            }
        }
    }
};