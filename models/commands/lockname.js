const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "nameLockData.json");

function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            return JSON.parse(fs.readFileSync(dataPath, "utf8"));
        }
    } catch(e) {}
    return {};
}

function saveData(data) {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
    } catch(e) {}
}

module.exports.config = {
    name: "namelock",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Ahmad RDX",
    description: "Ahmad RDX - Group Name Lock System",
    commandCategory: "group",
    usages: "[on/off/status]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const data = loadData();
    const action = args[0]?.toLowerCase();

    // ===== STATUS =====
    if (!action || action === "status") {
        const lockData = data[threadID];
        if (lockData && lockData.locked) {
            return api.sendMessage(
                `🔒 **AHMAD RDX NAME LOCK**\n\n📌 Status: LOCKED\n📛 Name: ${lockData.name}\n👤 Locked By: ${lockData.lockedBy}\n📅 Date: ${lockData.date}`,
                threadID, messageID
            );
        }
        return api.sendMessage(`🔓 **UNLOCKED** - Group name change ho sakta hai!`, threadID, messageID);
    }

    // ===== LOCK =====
    if (action === "on" || action === "lock") {
        const threadInfo = await api.getThreadInfo(threadID);
        const currentName = threadInfo.threadName || threadInfo.name || "Group";

        let lockedByName = "Admin";
        try {
            const userInfo = await api.getUserInfo(senderID);
            lockedByName = userInfo[senderID]?.name || "Admin";
        } catch(e) {}

        data[threadID] = {
            locked: true,
            name: currentName,
            lockedBy: lockedByName,
            date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        };
        saveData(data);

        return api.sendMessage(
            `🔒 **AHMAD RDX NAME LOCKED!**\n\n📛 ${currentName}\n👤 By: ${lockedByName}\n\n⚠️ Ab koi name change nahi kar sakta!`,
            threadID, messageID
        );
    }

    // ===== UNLOCK =====
    if (action === "off" || action === "unlock") {
        if (!data[threadID] || !data[threadID].locked) {
            return api.sendMessage("⚠️ Lock already OFF hai!", threadID, messageID);
        }
        delete data[threadID];
        saveData(data);
        return api.sendMessage(`🔓 **UNLOCKED!** Ab naam change ho sakta hai!`, threadID, messageID);
    }

    return api.sendMessage("📌 .namelock on/off/status", threadID, messageID);
};

// ===== AUTO REVERT (MIRAI COMPATIBLE) =====
module.exports.handleEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;

    // Mirai mein name change event
    if (logMessageType !== "log:thread-name") return;
    if (!author) return;
    if (author === api.getCurrentUserID()) return;

    const data = loadData();
    const lockData = data[threadID];

    if (lockData && lockData.locked) {
        try {
            // Revert name
            await api.setTitle(lockData.name, threadID);

            let name = "Someone";
            try {
                const info = await api.getUserInfo(author);
                name = info[author]?.name || "Someone";
            } catch(e) {}

            api.sendMessage(
                `🚫 **AHMAD RDX NAME LOCK**\n\n👤 ${name} ne naam change karne ki koshish ki!\n📛 Reverted to: ${lockData.name}\n\n⚠️ Name locked hai! 😎`,
                threadID
            );
        } catch(e) {
            console.log(e);
        }
    }
};