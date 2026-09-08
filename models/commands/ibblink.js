module.exports.config = {
    name: "link",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍",
    description: "Upload multiple images to ImgBB and get links",
    commandCategory: "Utility",
    usages: "[reply to one or more images]",
    cooldowns: 5,
    dependencies: {
      "axios": ""
    }
};

module.exports.run = async ({ api, event }) => {
  const axios = global.nodemodule['axios'];

  try {
    // Check if there's a reply with attachments
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage(
        `༻﹡﹡﹡﹡﹡﹡﹡༺\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐨𝐧𝐞 𝐨𝐫 𝐦𝐨𝐫𝐞 𝐢𝐦𝐚𝐠𝐞𝐬!\n\n༻﹡﹡﹡﹡﹡﹡﹡༺`,
        event.threadID,
        event.messageID
      );
    }

    // ImgBB API details
    const apiKey = 'e17a15dd6af452cbe53747c0b2b0866d'; // Your working API key
    const uploadUrl = 'https://api.imgbb.com/1/upload';

    // Array to store all image URLs
    const uploadedUrls = [];

    // Process each attachment
    for (const attachment of event.messageReply.attachments) {
      try {
        // Fetch the image as buffer
        const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('image', base64Image);

        // Upload to ImgBB
        const uploadResponse = await axios.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        // Add the uploaded image URL to the array
        uploadedUrls.push(uploadResponse.data.data.url);

      } catch (err) {
        console.error('Error uploading image:', err);
        uploadedUrls.push(`❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐮𝐩𝐥𝐨𝐚𝐝: ${attachment.url}`);
      }
    }

    // Create response message with all URLs
    let message = '⎯꯭᪳✫꯭🎸꯭≛⃝𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗⎯᪳⤹🌷\n\n≿━━━━༺❀༻━━━━≾\n\n⚡ 𝗨𝗣𝗟𝗢𝗔𝗗𝗘𝗗 𝗜𝗠𝗔𝗚𝗘 𝗟𝗜𝗡𝗞𝗦 ⚡\n\n';
    uploadedUrls.forEach((url, index) => {
      message += `👉 ${index + 1}. ${url}\n`;
    });

    // Send the links back
    return api.sendMessage(
      `≿━━━━༺❀༻━━━━≾\n\n${message}\n≿━━━━༺❀༻━━━━≾`,
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error('Error:', error);
    return api.sendMessage(
      `⚝──⭒─⭑─⭒──⚝\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐩𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐭𝐡𝐞 𝐢𝐦𝐚𝐠𝐞𝐬.\n🔁 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.\n\n⚝──⭒─⭑─⭒──⚝`,
      event.threadID,
      event.messageID
    );
  }
};