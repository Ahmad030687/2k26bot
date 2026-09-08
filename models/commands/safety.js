module.exports.config = {
    name: "safety",
    version: "2.7.0",
    hasPermssion: 1, 
    credits: "Ahmad RDX",
    description: "Stable Group safety system with detailed error logging",
    commandCategory: "Admin",
    usages: "on / off",
    cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event, Threads, Users }) {
    const { threadID, messageID, senderID, body, type } = event;

    // Check if message has body and type is correct
    if (!body || (type !== "message" && type !== "message_reply")) return;

    // 🕵️ AHMAD BHAI (VIP BYPASS)
    const ahmadID = "61577631137537"; 
    if (senderID == ahmadID) return;

    try {
        // 🛡️ Data Fetching with Safety Check
        const threadData = await Threads.getData(threadID);
        if (!threadData || !threadData.data) return; // Agar data nahi hai toh skip

        if (threadData.data.antiGali !== true) return;

        // 🔞 ZEHRI GALI LIST (Updated)
        const badWords = [
            "chot", "gand", "bkl", "bc", "mc", "gando", "phudi", "phuda", "bsdk", 
            "maa ko", "behan ko", "ami ko", "bihen", "behen ko", "chut", "gandu", "chutiye", 
            "gamd", "texi", "gashti", "randi", "lan", "lol", "phuda", "phudi", 
            "loda", "maderchod", "behenchod", "lora", "kanjar", "tatta", "gandu", "pel", "pelo", "pelu"
        ];

        const msgLower = body.toLowerCase();
        const isAbusive = badWords.some(word => msgLower.includes(word));

        if (isAbusive) {
            // 1. Delete Message
            await api.unsendMessage(messageID).catch(err => console.log("Unsend failed:", err));

            // 2. Kick and Warn
            let name = await Users.getNameUser(senderID) || "User";
            
            return api.sendMessage(`🚫 **[ RDX SAFETY ]** 🚫\n\nOye ${name}! Bad-tameezi ki saza KICK hai. Ahmad bhai ke group mein tameez se raho! 👋👊`, threadID, () => {
                api.removeUserFromGroup(senderID, threadID).catch(e => {
                    api.sendMessage("⚠️ Bot Admin nahi hai, isliye kick nahi kar saka!", threadID);
                });
            });
        }
    } catch (err) {
        // 🔥 FIX: Ab console mein [object Object] nahi balkay asli error dikhega
        console.error("--- RDX SAFETY EVENT ERROR ---");
        console.error(err); 
    }
};

module.exports.run = async function ({ api, event, args, Threads }) {
    const { threadID, messageID } = event;
    
    try {
        let threadInfo = await Threads.getData(threadID);
        if (!threadInfo) {
            return api.sendMessage("❌ Thread database mein nahi mila!", threadID, messageID);
        }

        let data = threadInfo.data || {};

        if (args[0] === "on") {
            data.antiGali = true;
            await Threads.setData(threadID, { data });
            return api.sendMessage("🛡️ **RDX SAFETY: ON**\n\nSystem active hai. Ab har message scan hoga! 👊", threadID, messageID);
        } 
        else if (args[0] === "off") {
            data.antiGali = false;
            await Threads.setData(threadID, { data });
            return api.sendMessage("⚠️ **RDX SAFETY: OFF**\n\nAnti-Abuse system band kar diya gaya hai.", threadID, messageID);
        } 
        else {
            return api.sendMessage("❌ Sahi tariqa: `.safety on` ya `.safety off`", threadID, messageID);
        }
    } catch (e) {
        console.error("--- RDX SAFETY RUN ERROR ---");
        console.error(e);
        return api.sendMessage("❌ Database Error! Console check karein.", threadID, messageID);
    }
};