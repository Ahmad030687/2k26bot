const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "copymembers",
    version: "4.0.0",
    hasPermssion: 2, 
    credits: "AHMAD RDX",
    description: "Remote Member Migrator with ID Fetcher",
    commandCategory: "admin",
    usages: "[copy <ThreadID> / paste]",
    cooldowns: 5
};

if (!global.rdx_clipboard) {
    global.rdx_clipboard = [];
}

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();

    // --- REMOTE COPY FEATURE ---
    if (action === "copy") {
        // Agar ID di hai to wahan se copy karega, warna current group se
        const targetID = args[1] || threadID; 
        
        try {
            const loading = await api.sendMessage(`🔍 Group ID: ${targetID} se members fetch ho rahe hain...`, threadID);
            
            const threadInfo = await api.getThreadInfo(targetID);
            const participants = threadInfo.participantIDs.filter(id => id !== api.getCurrentUserID());
            
            global.rdx_clipboard = participants;

            api.unsendMessage(loading.messageID);
            return api.sendMessage(`✅ **𝗠𝗘𝗠𝗕𝗘𝗥𝗦 𝗖𝗢𝗣𝗜𝗘𝗗 (REMOTE)**\n━━━━━━━━━━━━━━━━━━\n👥 **Group Name:** ${threadInfo.threadName || "Unknown Group"}\n👥 **Total Members:** ${participants.length}\n━━━━━━━━━━━━━━━━━━\n💡 Ab apne target group mein ja kar likhein: \`.copymembers paste\``, threadID, messageID);
        } catch (e) {
            return api.sendMessage("❌ **ERROR:** Bot us group mein nahi hai ya ID galat hai. Pehle bot ko us group mein add karein.", threadID, messageID);
        }
    }

    // --- PASTE FEATURE ---
    if (action === "paste") {
        if (!global.rdx_clipboard || global.rdx_clipboard.length === 0) {
            return api.sendMessage("⚠️ Pehle kisi group se `.copymembers copy` karein.", threadID, messageID);
        }

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const currentMembers = threadInfo.participantIDs;
            const membersToAdd = global.rdx_clipboard.filter(id => !currentMembers.includes(id));

            if (membersToAdd.length === 0) {
                return api.sendMessage("⚠️ Sab members pehle se hi yahan hain.", threadID, messageID);
            }

            api.sendMessage(`🚀 **𝗠𝗜𝗚𝗥𝗔𝗧𝗜𝗢𝗡 𝗦𝗧𝗔𝗥𝗧𝗘𝗗**\n━━━━━━━━━━━━━━━━━━\n🔄 Adding: ${membersToAdd.length} Members\n⏳ Safety Delay: 3s\n━━━━━━━━━━━━━━━━━━`, threadID);

            let success = 0;
            let fail = 0;

            for (const userID of membersToAdd) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec anti-ban delay
                    await api.addUserToGroup(userID, threadID);
                    success++;
                } catch (err) {
                    fail++;
                }
            }

            global.rdx_clipboard = []; 
            return api.sendMessage(`🏁 **𝗗𝗢𝗡𝗘**\n━━━━━━━━━━━━━━━━━━\n✅ Added: ${success}\n❌ Failed: ${fail}\n━━━━━━━━━━━━━━━━━━\n⚡ *Ahmad Ali Safdar*`, threadID);

        } catch (e) {
            api.sendMessage("🔄 Bypass mode active! Adding members directly...", threadID);
            let s = 0;
            for (const id of global.rdx_clipboard) {
                try {
                    await new Promise(r => setTimeout(r, 3000));
                    await api.addUserToGroup(id, threadID);
                    s++;
                } catch(err) {}
            }
            return api.sendMessage(`🏁 Force-Migration Complete. Added: ${s}`, threadID);
        }
    }

    return api.sendMessage("❓ Usages:\n1. `.copymembers copy` (Current group)\n2. `.copymembers copy <ID>` (Remote group)\n3. `.copymembers paste` (Target group)", threadID, messageID);
};