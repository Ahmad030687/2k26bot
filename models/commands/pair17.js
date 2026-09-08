module.exports.config = {
    name: "pairing",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "SHAAN KHAN",
    description: "Tag se ya random pairing photo",
    commandCategory: "Picture",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "jimp": ""
    }
};

// Folder path ko 'noprefix' par set kiya gaya hai
module.exports.onLoad = async () => {
    const { resolve } = global.nodemodule.path;
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { downloadFile } = global.utils;
    
    // Yahan path change kar diya gaya hai
    const dirPath = __dirname + "/noprefix/";
    const imagePath = resolve(__dirname, 'noprefix', 'pair17.png');

    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    if (!existsSync(imagePath)) await downloadFile("https://i.ibb.co/r8T04zP/pair17.jpg", imagePath);
};

async function makeImage({ one, two }) {
    const fs = global.nodemodule["fs-extra"];
    const path = global.nodemodule.path;
    const axios = global.nodemodule.axios;
    const jimp = global.nodemodule.jimp;
    
    // Path updated to noprefix
    const cachePath = path.resolve(__dirname, 'noprefix');
    
    let baseImage = await jimp.read(cachePath + '/pair17.png');
    let pathOne = cachePath + `/avt_${one}.png`;
    let pathTwo = cachePath + `/avt_${two}.png`;

    let getAvt1 = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(pathOne, Buffer.from(getAvt1, 'utf-8'));

    let getAvt2 = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(pathTwo, Buffer.from(getAvt2, 'utf-8'));

    let avatar1 = await jimp.read(await circle(pathOne));
    let avatar2 = await jimp.read(await circle(pathTwo));

    // Coordinate positions vahi rakhi hain jo original code mein thi
    baseImage.composite(avatar1.resize(207, 207), 110, 231)
             .composite(avatar2.resize(200, 200), 332, 233);

    let canvasPath = cachePath + `/pairing_${one}_${two}.png`;
    await baseImage.writeAsync(canvasPath);

    fs.unlinkSync(pathOne);
    fs.unlinkSync(pathTwo);
    
    return canvasPath;
}

async function circle(imagePath) {
    const jimp = require('jimp');
    let img = await jimp.read(imagePath);
    img.circle();
    return await img.getBufferAsync("image/png");
}

module.exports.run = async function({ api, event, args }) {
    const fs = require("fs-extra");
    const { threadID, messageID, senderID, mentions } = event;
    const cachePath = __dirname + "/noprefix/";
    
    let mentorID, mentorName;
    if (Object.keys(mentions).length > 0) {
        mentorID = Object.keys(mentions)[0];
        mentorName = mentions[mentorID];
    } else {
        const threadInfo = await api.getThreadInfo(threadID);
        const list = threadInfo.participantIDs.filter(id => id !== senderID);
        mentorID = list[Math.floor(Math.random() * list.length)];
        let info = await api.getUserInfo(mentorID);
        mentorName = info[mentorID].name;
    }

    const myInfo = await api.getUserInfo(senderID);
    const myName = myInfo[senderID].name;
    
    const scores = ['21%', '83%', '96%', '100%', '48%']; // Kuch scores kam kar diye hain
    const randomScore = scores[Math.floor(Math.random() * scores.length)];

    const targetInfo = await api.getUserInfo(mentorID);
    const genderId = targetInfo[mentorID].gender;
    const gender = genderId == 2 ? "Male🧑" : genderId == 1 ? "Female👩‍" : "Other🌈";

    const imgPath = await makeImage({ one: senderID, two: mentorID });
    
    const msg = `🌸===『*★𝐂𝐫𝐞𝐝𝐢𝐭'𝐬 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗*』===🌸\n\n💞 ${myName} is now paired with ${mentorName} 💘\n\n🧬 Gender: ${gender}\n📊 Pairing Score: ${randomScore}`;

    return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imgPath),
        mentions: [{ id: senderID, tag: myName }, { id: mentorID, tag: mentorName }]
    }, threadID, () => fs.unlinkSync(imgPath), messageID);
};
