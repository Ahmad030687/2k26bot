module.exports.config = {
        name: "outall",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "SHAAN KHAN ",
        description: "Bot leaves all groups except the current one",
        commandCategory: "Admin",
        usages: "outall",
        cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    // Yaha apna admin ID check karein
    const permission = ["100016828397863", "", ""];
    
    if (!permission.includes(event.senderID))
        return api.sendMessage("Sorry boss, mujhe sirf mere Shaan Khan hi saare groups se leave karwa sakte hain 🙂✌️", event.threadID, event.messageID);

    return api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (err) {
            console.error(err);
            return api.sendMessage("Kuch error aaya hai groups fetch karne mein.", event.threadID);
        }

        list.forEach(item => {
            if (item.isGroup == true && item.threadID != event.threadID) {
                api.removeUserFromGroup(api.getCurrentUserID(), item.threadID);
            }
        });

        api.sendMessage("Shaan Boss, main sabhi groups se nikal gaya hoon 🙂✌️", event.threadID);
    });
};
