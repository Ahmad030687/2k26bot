module.exports.config = {
    name: "filter",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Shaan Khan",
    description: "Filter Facebook User (Deactivated Accounts)",
    commandCategory: "filter box",
    usages: "",
    cooldowns: 300
};

module.exports.run = async function({ api, event }) {
    var { userInfo, adminIDs } = await api.getThreadInfo(event.threadID);
    var successCount = 0;
    var failCount = 0;
    var filteredUsers = [];

    // Identification for 'Facebook User'
    for (const user of userInfo) {
        if (user.gender == undefined) {
            filteredUsers.push(user.id);
        }
    }

    const isBotAdmin = adminIDs.map(admin => admin.id).some(id => id == api.getCurrentUserID());

    if (filteredUsers.length == 0) {
        return api.sendMessage("Group mein koi bhi 'Facebook User' nahi mila.", event.threadID);
    }

    return api.sendMessage("Aapke group mein " + filteredUsers.length + " 'Facebook Users' mile hain.", event.threadID, function() {
        if (isBotAdmin) {
            api.sendMessage("Filtering shuru ho rahi hai...\n\nMade by Shaan Khan", event.threadID, async function() {
                for (const userID of filteredUsers) {
                    try {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        await api.removeUserFromGroup(parseInt(userID), event.threadID);
                        successCount++;
                    } catch (error) {
                        failCount++;
                    }
                }

                api.sendMessage("✅ Boss Ahmad ki taraf se " + successCount + " users ko nikal diya gaya hai.", event.threadID, function() {
                    if (failCount != 0) {
                        return api.sendMessage("❎ " + failCount + " users ko nikalne mein nakami hui.", event.threadID);
                    }
                });
            });
        } else {
            api.sendMessage("Bot admin nahi hai, isliye filter nahi kar sakta.", event.threadID);
        }
    });
};