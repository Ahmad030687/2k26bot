const fs = require("fs");
const request = require("request");

module.exports.config = {
	name: "groupinfo",
	version: "1.0.1", 
	hasPermssion: 1,
	credits: "𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗",
	description: "View your box information (Remote Supported)",
	commandCategory: "Box", 
	usages: "groupinfo [ThreadID]", 
	cooldowns: 0,
	dependencies: [] 
};

module.exports.run = async function({ api, event, args }) {
    // 🚀 REMOTE LOGIC ADDED: Agar ID di hai to targetID wo hogi, warna current group ki ID
    let targetID = args[0] || event.threadID;

    try {
        let threadInfo = await api.getThreadInfo(targetID);
        var memLength = threadInfo.participantIDs.length;
        let threadMem = threadInfo.participantIDs.length;
        var nameMen = [];
        var gendernam = [];
        var gendernu = [];
        var nope = [];
        
        for (let z in threadInfo.userInfo) {
            var gioitinhone = threadInfo.userInfo[z].gender;
            var nName = threadInfo.userInfo[z].name;
            if(gioitinhone == "MALE"){gendernam.push(z+gioitinhone)}
            else if(gioitinhone == "FEMALE"){gendernu.push(gioitinhone)}
            else{nope.push(nName)}
        };
        
        var nam = gendernam.length;
        var nu = gendernu.length;
        let qtv = threadInfo.adminIDs.length;
        let sl = threadInfo.messageCount;
        let u = threadInfo.nicknames;
        let icon = threadInfo.emoji;
        let threadName = threadInfo.threadName;
        let id = threadInfo.threadID;
        let sex = threadInfo.approvalMode;
        var pd = sex == false ? 'Turned off' : sex == true ? 'Turned on' : 'Kh';
        
        // Image path ko unique banaya hai taake aik waqt mein do log command use karein to masla na ho
        let imgPath = __dirname + `/cache/${Date.now()}_${targetID}.png`;

        var callback = () =>
            api.sendMessage(
                {
                    body: `🔧 GC Name: ${threadName}\n🔧 Group ID: ${id}\n🔧 Approval: ${pd}\n🔧 Emoji: ${icon}\n🔧 Information: including ${threadMem} members\n🔧 Number of males: ${nam} members\n🔧 Number of females: ${nu} members\n🔧 With ${qtv} administrators\n🔧 Total number of messages: ${sl} msgs.\n\nMade with ❤️ by: 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗`,
                    attachment: fs.createReadStream(imgPath)
                },
                event.threadID,
                () => fs.unlinkSync(imgPath),
                event.messageID
            );
            
        // DP fetch karne ka request
        return request(encodeURI(`${threadInfo.imageSrc}`))
            .pipe(fs.createWriteStream(imgPath))
            .on('close', () => callback());

    } catch (error) {
        // Agar group ID galat hui ya bot us group mein na hua
        return api.sendMessage(`❌ Error: Bot is group (${targetID}) main nahi hai ya ID galat hai.`, event.threadID, event.messageID);
    }
}