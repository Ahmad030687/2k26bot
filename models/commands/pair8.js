const axios = require("axios");
const fs = require("fs-extra");
const jimp = require("jimp");
const path = require("path");

module.exports.config = {
    name: "pair8",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "uzairrajput",
    description: "Tag se ya random pairing photo",
    commandCategory: "Picture",
    usePrefix: false, 
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "jimp": ""
    }
};

module.exports.onLoad = async () => {
    const { existsSync, mkdirSync } = require("fs-extra");
    // Ab ye "cache/noprefix" folder use karega
    const dirPath = path.join(__dirname, "..", "cache", "noprefix");
    const imgPath = path.join(dirPath, "SHAAN.jpeg");

    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    if (!existsSync(imgPath)) {
        const getImg = (await axios.get("https://i.ibb.co/GDYZVM1/SHAAN.jpg", { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(getImg, "utf-8"));
    }
};

async function circle(imagePath) {
    let img = await jimp.read(imagePath);
    img.circle();
    return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
    const dirPath = path.join(__dirname, "..", "cache", "noprefix");
    let baseImage = await jimp.read(path.join(dirPath, "SHAAN.jpeg"));
    
    let outputPath = path.join(dirPath, `pairing_${one}_${two}.png`);
    let avatar1Path = path.join(dirPath, `avt_${one}.png`);
    let avatar2Path = path.join(dirPath, `avt_${two}.png`);

    // Download Avatars
    let avt1 = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(avatar1Path, Buffer.from(avt1, "utf-8"));

    let avt2 = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(avatar2Path, Buffer.from(avt2, "utf-8"));

    let circleAvt1 = await jimp.read(await circle(avatar1Path));
    let circleAvt2 = await jimp.read(await circle(avatar2Path));

    // Image Positioning
    baseImage.composite(circleAvt1.resize(264, 264), 11, 240)
              .composite(circleAvt2.resize(262, 262), 450, 240);

    let finalBuffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(outputPath, finalBuffer);
    
    // Cleanup Temp Avatars
    fs.unlinkSync(avatar1Path);
    fs.unlinkSync(avatar2Path);
    
    return outputPath;
}

module.exports.run = async function({ api, event }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    let mentionID, mentionName;
    if (Object.keys(mentions).length > 0) {
        mentionID = Object.keys(mentions)[0];
        mentionName = mentions[mentionID].replace(/@/g, "");
    } else {
        const threadInfo = await api.getThreadInfo(threadID);
        const randomID = threadInfo.participantIDs.filter(id => id !== senderID);
        mentionID = randomID[Math.floor(Math.random() * randomID.length)];
        let userData = await api.getUserInfo(mentionID);
        mentionName = userData[mentionID].name;
    }

    const senderData = await api.getUserInfo(senderID);
    const senderName = senderData[senderID].name;
    
    const scores = ["83%", "67%", "96%", "100%", "48%", "75%", "92%"];
    const randomScore = scores[Math.floor(Math.random() * scores.length)];
    
    const genderData = (await api.getUserInfo(mentionID))[mentionID].gender;
    const genderText = genderData == 2 ? "Male🧑" : genderData == 1 ? "Female👩‍" : "Other🌈";

    return makeImage({ one: senderID, two: mentionID }).then(path => {
        const msg = {
            body: `𝐂𝐫𝐞𝐝𝐢𝐭 ➻ 𝐎𝐖𝐍𝐄𝐑 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗\n\n◈ ━━━━━━━━━━━━ 💚✨\n\n➻ 〘 ${senderName} 〙 💞 is now paired with 💘 〘 ${mentionName} 〙\n\n🧬 Gender: ${genderText}\n📊 Pairing Score: ${randomScore}\n\n◈ ━━━━━━━━━━━━ 💚✨`,
            attachment: fs.createReadStream(path)
        };
        return api.sendMessage(msg, threadID, () => fs.unlinkSync(path), messageID);
    });
};
