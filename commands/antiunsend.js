const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Bot ki memory jahan wo saare messages chupa kar rakhega
if (!global.messageCache) global.messageCache = new Map();

module.exports.config = {
 name: "antiunsend",
 version: "2.0.0",
 hasPermssion: 0,
 credits: "Ahmad Boss",
 description: "Unsend kiye gaye messages ko pakar kar wapis bhejta hai",
 commandCategory: "Group",
 usages: "antiunsend",
 cooldowns: 2
};

// ================= MESSAGE CHUPANE AUR PAKARNE WALI LOGIC =================
module.exports.handleEvent = async function ({ api, event }) {
 const { threadID, messageID, senderID, type, body, attachments } = event;

 // 1. Jab koi naya message aaye (Text, Photo, Voice, Sticker), toh usay save kar lo
 if (type === "message" || type === "message_reply") {
 global.messageCache.set(messageID, {
 senderID,
 body: body || "",
 attachments: attachments || []
 });
 
 // Memory full hone se bachane ke liye sirf aakhri 1000 messages save rakho
 if (global.messageCache.size > 1000) {
 const firstKey = global.messageCache.keys().next().value;
 global.messageCache.delete(firstKey);
 }
 }

 // 2. Jab koi apna message UNSEND (delete) kare!
 if (type === "message_unsend") {
 const deletedMessage = global.messageCache.get(messageID);
 if (!deletedMessage) return; // Agar bot restart hone se pehle ka message hai toh chhor do

 // Bande ka naam nikalna
 let senderName = "Kisi shaks";
 try {
 const userInfo = await api.getUserInfo(deletedMessage.senderID);
 senderName = userInfo[deletedMessage.senderID].name;
 } catch (e) { /* Ignore error */ }

 // Text Message tayar karna
 let replyMsg = `🚨 **Aha! Pakra Gaya!** 🚨\n\n👤 **Bande Ka Naam:** ${senderName}\n❌ **Isne Ye Unsend Kiya Tha:**\n\n`;
 if (deletedMessage.body) {
 replyMsg += `📝 **Text:** ${deletedMessage.body}\n`;
 }

 let msgObj = { body: replyMsg, attachment: [] };

 // 3. Agar Photo, Video, Sticker ya Voice Note thi, toh usay download kar ke attach karo
 if (deletedMessage.attachments.length > 0) {
 const cacheDir = path.join(__dirname, "cache");
 fs.ensureDirSync(cacheDir); // Cache folder na ho toh bana lo

 let i = 0;
 for (const att of deletedMessage.attachments) {
 try {
 let url = att.url;
 let ext = "bin";
 
 if (att.type === "photo") ext = "jpg";
 else if (att.type === "video") ext = "mp4";
 else if (att.type === "audio") ext = "mp3"; // Voice note
 else if (att.type === "animated_image") ext = "gif";
 else if (att.type === "sticker") ext = "png";

 let filePath = path.join(cacheDir, `unsend_${Date.now()}_${i}.${ext}`);
 let res = await axios.get(url, { responseType: "arraybuffer" });
 fs.writeFileSync(filePath, Buffer.from(res.data, "utf-8"));
 
 msgObj.attachment.push(fs.createReadStream(filePath));
 i++;
 } catch (err) {
 console.error("Attachment recover karne mein masla:", err);
 }
 }
 }

 // 4. Sab kuch wapis group mein phenk do!
 api.sendMessage(msgObj, threadID, () => {
 // Message send hone ke baad downloaded files ko delete kar do taake storage full na ho
 for (const stream of msgObj.attachment) {
 try { fs.unlinkSync(stream.path); } catch (e) {}
 }
 });
 }
};

// ================= COMMAND RUN (On/Off toggle ke liye future mein use kar sakte ho) =================
module.exports.run = async function ({ api, event }) {
 return api.sendMessage("👁️ **Mano's Third Eye is ON!**\n\nAb is group mein jo bhi message unsend (delete) karega, main uski sari cheezein wapis group mein bhej dungi! 😂🔥", event.threadID, event.messageID);
};