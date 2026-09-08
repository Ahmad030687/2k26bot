const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.resendCache) global.resendCache = new Map();

module.exports.config = {
 name: "resend",
 version: "3.0.0",
 hasPermssion: 0,
 credits: "Ahmad Boss",
 description: "Anti-Unsend with Force Cache",
 commandCategory: "System",
 usages: "",
 cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
 const { threadID, messageID, senderID, type, body, attachments } = event;

 // 1. SAVE ALL MESSAGES (Har message ko save karo)
 if (type === "message" || type === "message_reply") {
 global.resendCache.set(messageID, {
 body: body || "",
 attachments: attachments || [],
 senderID: senderID
 });
 }

 // 2. CATCH UNSEND (Jab delete ho)
 if (type === "message_unsend") {
 const data = global.resendCache.get(messageID);
 if (!data) return; // Agar data nahi mila toh wapis jao

 let name = "User";
 try {
 const info = await api.getUserInfo(data.senderID);
 name = info[data.senderID].name;
 } catch (e) {}

 let msg = `📢 **Ahmad Boss, Pakra Gaya!**\n👤 **Naam:** ${name}\n❌ **Unsend:** `;
 if (data.body) msg += data.body;

 const sendObj = { body: msg, attachment: [] };

 if (data.attachments && data.attachments.length > 0) {
 const cacheDir = path.join(__dirname, "cache");
 if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

 for (let i = 0; i < data.attachments.length; i++) {
 try {
 const att = data.attachments[i];
 let ext = att.type === "photo" ? "jpg" : att.type === "video" ? "mp4" : att.type === "audio" ? "mp3" : "bin";
 let filePath = path.join(cacheDir, `resend_${Date.now()}_${i}.${ext}`);
 
 let getAtt = await axios.get(att.url, { responseType: "arraybuffer" });
 fs.writeFileSync(filePath, Buffer.from(getAtt.data, "utf-8"));
 sendObj.attachment.push(fs.createReadStream(filePath));
 } catch (err) { console.log(err) }
 }
 }

 return api.sendMessage(sendObj, threadID);
 }
};

module.exports.run = async function ({ api, event }) {
 return api.sendMessage("👁️ Anti-Unsend System is running in background!", event.threadID);
};