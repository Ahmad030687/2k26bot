module.exports.config = {
    name: "edit",
    version: "4.0.0",
    hasPermssion: 2,
    credits: "AHMII",
    description: "Edit images using GiftedTech PhotoEditor V2",
    commandCategory: "Media",
    usages: "[prompt] - Reply to an image",
    prefix: false,
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const fs = require("fs");
    const path = require("path");

    const { threadID, messageID, messageReply, type } = event;

    // ✅ Check reply
    if (type !== "message_reply" || !messageReply) {
        return api.sendMessage("⚠️ Reply to an image with prompt!", threadID, messageID);
    }

    if (!messageReply.attachments || messageReply.attachments.length === 0) {
        return api.sendMessage("❌ No image found!", threadID, messageID);
    }

    const attachment = messageReply.attachments[0];

    if (attachment.type !== "photo") {
        return api.sendMessage("❌ Please reply to an image only!", threadID, messageID);
    }

    // ✅ Prompt
    const prompt = args.join(" ");
    if (!prompt) {
        return api.sendMessage("❌ Provide a prompt!", threadID, messageID);
    }

    const imageUrl = attachment.url;

    // ⏳ Processing message
    const processingMsg = await api.sendMessage(
        "🎨 Editing image...\n⏳ This may take up to 3 minutes...",
        threadID
    );

    try {
        const cacheDir = path.resolve(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const filePath = path.join(cacheDir, `nano_${Date.now()}.png`);

        // ✅ NEW API (direct image stream)
        const apiUrl = `https://api.giftedtech.co.ke/api/tools/photoeditorv2?apikey=gifted&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&model=gpt-image-1`;

        const response = await axios({
            url: apiUrl,
            method: "GET",
            responseType: "stream",
            timeout: 180000 // ⏱️ 3 minutes
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
            api.unsendMessage(processingMsg.messageID);

            api.sendMessage(
                {
                    body: `✨ Image Edited Successfully!\n\n📝 Prompt: ${prompt}`,
                    attachment: fs.createReadStream(filePath)
                },
                threadID,
                () => fs.unlinkSync(filePath),
                messageID
            );
        });

        writer.on("error", () => {
            api.unsendMessage(processingMsg.messageID);
            api.sendMessage("❌ Failed to save image!", threadID, messageID);
        });

    } catch (err) {
        api.unsendMessage(processingMsg.messageID);

        let msg = "❌ Error occurred!";
        if (err.code === "ECONNABORTED") {
            msg = "⏰ Request timeout (3 min). Try again!";
        } else if (err.message) {
            msg += `\n${err.message}`;
        }

        api.sendMessage(msg, threadID, messageID);
    }
};