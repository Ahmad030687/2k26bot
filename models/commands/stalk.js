const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'stalk',
  version: '2.1.0',
  hasPermssion: 0, // 👈 Ye lazmi hota hai framework ke liye
  credits: '𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗',
  description: 'Get user profile information (Stable Version)',
  commandCategory: 'Utility', // 👈 'category' ki jagah ye use hota hai
  usages: 'stalk [mention/reply/uid]', // 👈 'usage' ki jagah 'usages'
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users, Currencies }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;
  
  // 🔍 UID Detection (100% Reliable)
  let uid;
  if (Object.keys(mentions).length > 0) {
    uid = Object.keys(mentions)[0];
  } else if (args[0] && /^\d+$/.test(args[0])) {
    uid = args[0];
  } else if (messageReply) {
    uid = messageReply.senderID;
  } else {
    uid = senderID;
  }

  try {
    // 📡 Fetching Data using Stable Method
    const info = await api.getUserInfo(uid);
    const userData = info[uid];
    
    if (!userData) {
      return api.sendMessage('❌ Error: User information fetch nahi ho saki.', threadID, messageID);
    }

    // Basic Details
    const name = userData.name || "Unknown";
    const gender = userData.gender === 1 ? "Female" : userData.gender === 2 ? "Male" : "Unknown";
    const vanity = userData.vanity || "No Username";
    const isFriend = userData.isFriend ? "Yes" : "No";
    const profileUrl = `https://www.facebook.com/${uid}`;

    // Economy Details (From your bot system)
    let money = 0;
    try {
      money = (await Currencies.getData(uid)).money || 0;
    } catch (e) {
      money = 0; // Fallback agar Currencies module load na ho
    }

    const msg = `🕵️‍♂️ 𝐒𝐓𝐀𝐋𝐊𝐈𝐍𝐆 𝐑𝐄𝐏𝐎𝐑𝐓 🕵️‍♂️
═══════════════════════
👤 𝐍𝐚𝐦𝐞: ${name}
🆔 𝐔𝐈𝐃: ${uid}
⚧ 𝐆𝐞𝐧𝐝𝐞𝐫: ${gender}
🔗 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${vanity}
🤝 𝐅𝐫𝐢𝐞𝐧𝐝: ${isFriend}
💰 𝐌𝐨𝐧𝐞𝐲: $${money.toLocaleString()}
🌐 𝐏𝐫𝐨𝐟𝐢𝐥𝐞: ${profileUrl}
═══════════════════════
✨ 𝐒𝐭𝐚𝐥𝐤𝐞𝐝 𝐛𝐲: ${await Users.getNameUser(senderID)}`;

    // 🖼️ Avatar Fetching
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const avatarPath = path.join(cacheDir, `stalk_${uid}.jpg`);
    
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=1024&height=1024&access_token=${token}`;

    const imgRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(avatarPath, Buffer.from(imgRes.data));

    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(avatarPath)
    }, threadID, () => {
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }, messageID);

  } catch (error) {
    return api.sendMessage(`❌ Failed to stalk: ${error.message}`, threadID, messageID);
  }
};