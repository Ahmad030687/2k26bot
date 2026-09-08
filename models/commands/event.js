const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "event",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Ahmad RDX",
    description: "Edit existing events via reply",
    commandCategory: "System",
    usages: "[filename.js]",
    cooldowns: 2
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const ahmadID = "61588926610680";

    if (senderID !== ahmadID) return api.sendMessage("❌ Access Denied!", threadID);

    const eventPath = path.join(__dirname, '..', 'events');
    const fileName = args[0];

    if (!fileName) return api.sendMessage("❓ Usage: .editevent [filename.js]", threadID, messageID);

    const pureName = fileName.endsWith('.js') ? fileName : fileName + '.js';
    const filePath = path.join(eventPath, pureName);

    if (!fs.existsSync(filePath)) return api.sendMessage(`❌ File '${pureName}' nahi mili!`, threadID, messageID);

    try {
        const oldCode = fs.readFileSync(filePath, 'utf8');
        return api.sendMessage(`📄 **OLD CODE: ${pureName}**\n━━━━━━━━━━━━━━━\n${oldCode}\n━━━━━━━━━━━━━━━\n\n💡 **Ahmad Bhai:** Is message ko REPLY karein naye code ke saath.`, threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                file: pureName,
                oldMsgID: info.messageID
            });
        }, messageID);
    } catch (err) {
        return api.sendMessage(`❌ Error reading file: ${err.message}`, threadID, messageID);
    }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    if (senderID !== handleReply.author) return;

    const eventPath = path.join(__dirname, '..', 'events');
    const filePath = path.join(eventPath, handleReply.file);

    try {
        // 1. Naya code save karein
        fs.writeFileSync(filePath, body, 'utf8');

        // 2. Purana code wala message unsend karein
        api.unsendMessage(handleReply.oldMsgID).catch(() => {});

        // 3. System ko reload karne ki koshish (Bina restart)
        try {
            delete require.cache[require.resolve(filePath)];
            const newEv = require(filePath);
            if (global.client && global.client.events) {
                global.client.events.set(newEv.config.name, newEv);
            }
            return api.sendMessage(`✅ **${handleReply.file}** Update ho gaya aur load bhi ho gaya!`, threadID, messageID);
        } catch (e) {
            return api.sendMessage(`✅ Code save ho gaya! Magar asar dikhane ke liye bot ko restart (.res) karein.`, threadID, messageID);
        }

    } catch (err) {
        return api.sendMessage(`❌ Save karne mein masla aya: ${err.message}`, threadID, messageID);
    }
};