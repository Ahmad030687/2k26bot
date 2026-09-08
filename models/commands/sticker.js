const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const Jimp = require('jimp'); // Pure Local Image Processor

module.exports.config = {
    name: "sticker",
    version: "3.0.0", // 100% Local & API-Free
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Convert any image into a round badge sticker locally without APIs",
    commandCategory: "media",
    usages: "Reply to a photo with .sticker",
    cooldowns: 2
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;

    // 1. Validation Checks
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
        return api.sendMessage("❌ Ustad, pehle kisi image par reply toh karo! 😅", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];
    if (attachment.type !== 'photo') {
        return api.sendMessage("❌ Ustad, sirf photo ka sticker ban sakta hai!", threadID, messageID);
    }

    const loadMsg = await api.sendMessage("⚡ Local engine se sticker generate ho raha hai...", threadID, messageID);

    const imageUrl = attachment.url;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `local_sticker_${Date.now()}.png`);

    try {
        // Image download into buffer
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer'
        });

        // Jimp se local processing suru
        const image = await Jimp.read(Buffer.from(response.data));
        
        // Sticker size (512x512 standard sticker ratio)
        const size = 512;
        
        // Square crop aur perfect circle cutting completely local
        image.cover(size, size) // Center se square crop
             .circle();         // Edges ko cut karke transparent round sticker banana

        // File locally save karna
        await image.writeAsync(filePath);

        // Send Sticker
        api.unsendMessage(loadMsg.messageID);
        return api.sendMessage({
            body: "╭━━ ✨ 𝗠𝗔𝗡𝗢 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 ✨ ━━╮\n  💝 Aapka Local Sticker Ready Hai!\n  🔒 100% API-Free Engine\n  👑 𝖮w𝗇𝖾𝗋 • 𝖠𝗁𝗆𝖺𝖽 𝖱𝖣𝖷\n╰━━━━━━━━━━━━━━━━━━━╯",
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, messageID);

    } catch (error) {
        console.error(error);
        api.unsendMessage(loadMsg.messageID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return api.sendMessage("❌ Error: Local processing mein koi masla aaya. Check karein 'jimp' install hai ya nahi!", threadID, messageID);
    }
};
