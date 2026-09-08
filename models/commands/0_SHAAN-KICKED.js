module.exports.config = {
        name: "kick",
        version: "1.0.1", 
        hasPermssion: 1,
        credits: "SHAAN KHAN",
        description: "THIS BOT WAS MADE BY MR SHAAN KHAN",
        commandCategory: "KICK MEMBER", 
        usages: "mention", 
        cooldowns: 0,
};

module.exports.languages = {
        "en": {
                "error": "Sorry boss, kuch gadbad hai 🤔",
                "needPermssion": "Sorry boss, main is group mein admin nahi hoon. Bina admin ke main kisi ko remove nahi kar sakta 😐✌️",
                "missingTag": "Boss, jisko remove karna hai group se usko mention karo saath mein 😐✌️"
        }
}

module.exports.run = async function({ api, event, getText, Threads }) {
        var mention = Object.keys(event.mentions);
        try {
                let dataThread = (await Threads.getData(event.threadID)).threadInfo;
                if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage(getText("needPermssion"), event.threadID, event.messageID);
                if(!mention[0]) return api.sendMessage(getText("missingTag"), event.threadID);
                if (dataThread.adminIDs.some(item => item.id == event.senderID)) {
                        for (const o in mention) {
                                setTimeout(() => {
                                        api.removeUserFromGroup(mention[o], event.threadID) 
                                }, 3000)
                        }
                }
        } catch { return api.sendMessage(getText("error"), event.threadID) }
}
