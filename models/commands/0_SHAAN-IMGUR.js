const axios = require("axios");

class Imgur {
  constructor() {
    this.clientId = "fc9369e9aea767c"; // your Imgur Client-ID
    this.client = axios.create({
      baseURL: "https://api.imgur.com/3/",
      headers: {
        Authorization: "Client-ID " + this.clientId
      }
    });
  }

  async uploadImage(imageUrl) {
    const res = await this.client.post("image", {
      image: imageUrl
    });
    return res.data.data.link;
  }
}

module.exports.config = {
  name: "imgur",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAAN BABU",
  description: "Upload image to Imgur",
  commandCategory: "Tool",
  usages: "Reply image",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    if (event.type !== "message_reply")
      return api.sendMessage(
        "⚠️ Please reply to the photo you want to upload.",
        event.threadID,
        event.messageID
      );

    const attachments = event.messageReply.attachments;
    if (!attachments || attachments.length === 0)
      return api.sendMessage(
        "⚠️ No image found in reply.",
        event.threadID,
        event.messageID
      );

    const imgur = new Imgur();
    let links = [];

    for (const att of attachments) {
      if (att.type !== "photo") continue;
      try {
        const link = await imgur.uploadImage(att.url);
        links.push(link);
      } catch (err) {
        console.log("Upload failed:", err.message);
      }
    }

    if (links.length === 0)
      return api.sendMessage(
        "❌ Upload failed.",
        event.threadID,
        event.messageID
      );

    api.sendMessage(
      `🖼️ IMGU R UPLOAD SUCCESS\n➝ Uploaded: ${links.length}\n➝ Image link(s):\n${links.join("\n")}`,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage(
      "❌ Something went wrong.",
      event.threadID,
      event.messageID
    );
  }
};
