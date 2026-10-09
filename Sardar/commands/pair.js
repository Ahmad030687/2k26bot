const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const animateProgress = require('../../controller/utility/animateProgress');

const cacheDir = path.join(__dirname, "cache", "pair");

function createHeartImage(size) {
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const nx = (px / size) * 4 - 2;
      const ny = -((py / size) * 4 - 2);
      const val = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3);
      if (val <= 0) {
        img.setPixelColor(0xFF1493FF, px, py);
      }
    }
  }
  return img;
}

async function makeCircle(buffer, size) {
  const img = await Jimp.read(buffer);
  img.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  const center = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.sqrt((x - center) ** 2 + (y - center) ** 2) <= center) {
        mask.setPixelColor(0xFFFFFFFF, x, y);
      }
    }
  }
  img.mask(mask, 0, 0);
  return img;
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: "pair",
    aliases: ["love", "lovepair", "match"],
    description: "Apna perfect match dhundo group mein!",
    usage: "pair [@mention / reply]",
    category: "Love",
    prefix: true,
    cooldowns: 15
  },

  async run({ api, event, send, Users, Currencies }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;



    const botID = api.getCurrentUserID();

    let partnerID = null;

    const mentionKeys = Object.keys(mentions || {});
    if (mentionKeys.length > 0) {
      partnerID = mentionKeys[mentionKeys.length - 1];
    } else if (messageReply) {
      partnerID = messageReply.senderID;
    } else {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.participantIDs.filter(m => m !== senderID && m !== botID);
        if (members.length === 0) return send.reply("❌ Group mein koi aur member nahi mila!");
        partnerID = members[Math.floor(Math.random() * members.length)];
      } catch {
        return send.reply("❌ Thread info load nahi ho saka. Kisi ko mention karo!");
      }
    }

    if (!partnerID) return send.reply("❌ Kisi member ko select karein!");
    if (partnerID === senderID) return send.reply("❌ Apne saath pairing nahi kar sakte!");

    const { msgID: loadMsgID, done: animDone } = await animateProgress(api, threadID, messageID, '💞', '𝐏𝐚𝐢𝐫', 'pair');

    try {
      fs.mkdirSync(cacheDir, { recursive: true });

      const AVT_SIZE = 220;
      const HEART_SIZE = 140;
      const PAD = 20;
      const CANVAS_W = AVT_SIZE + PAD + HEART_SIZE + PAD + AVT_SIZE;
      const CANVAS_H = AVT_SIZE;
      const heartX = AVT_SIZE + PAD;
      const heartY = Math.floor((CANVAS_H - HEART_SIZE) / 2);

      const [avt1Res, avt2Res] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${partnerID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
      ]);

      const [circ1, circ2] = await Promise.all([
        makeCircle(Buffer.from(avt1Res.data), AVT_SIZE),
        makeCircle(Buffer.from(avt2Res.data), AVT_SIZE)
      ]);

      const heartImg = createHeartImage(HEART_SIZE);

      const canvas = new Jimp({ width: CANVAS_W, height: CANVAS_H, color: 0xFFF0F5FF });
      canvas.composite(circ1, 0, 0);
      canvas.composite(heartImg, heartX, heartY);
      canvas.composite(circ2, AVT_SIZE + PAD + HEART_SIZE + PAD, 0);

      const outputPath = path.join(cacheDir, `pair_${senderID}_${partnerID}_${Date.now()}.png`);
      await canvas.write(outputPath);

      const senderName = await Users.getNameUser(senderID);
      const partnerName = await Users.getNameUser(partnerID);
      const loveLevel = Math.floor(Math.random() * 101);

      await animDone;

      const body =
        `┏━•❃°•°❀°•°❃•━┓\n\n` +
        `𝐎𝐰𝐧𝐞𝐫 ·˚ ༘₊·꒰➳ ̗̀➛   🍓  𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗\n\n` +
        `┗━•❃°•°❀°•°❃•━┛\n\n` +
        `✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n` +
        `❝ 𝑇𝑢𝑗ℎ𝑘𝑜 𝑑𝑒𝑘ℎ 𝑘𝑒 𝑏𝑎𝑠 𝑒𝑘 𝑘ℎ𝑦𝑎𝑎𝑙 𝑎𝑎𝑡𝑎 ℎ𝑎𝑖,\n` +
        `𝐷𝑖𝑙 𝑘𝑎ℎ𝑡𝑎 ℎ𝑎𝑖 𝑘𝑎𝑠ℎ 𝑡𝑢 𝑠𝑎𝑎𝑡ℎ ℎ𝑜... ❞\n\n` +
        `✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n` +
        `❝ 𝐸𝑘 𝑊𝑎𝑞𝑡 𝑎𝑎𝑦𝑒 𝑍𝑖𝑛𝑑𝑎𝑔𝑖 𝑚𝑒𝑖𝑛...\n` +
        `𝐽𝑎ℎ𝑎𝑎𝑛 𝑡𝑢 𝑣𝑖 𝑚𝑒𝑟𝑒 𝑝𝑦𝑎𝑟 𝑚𝑒𝑖𝑛 ℎ𝑜 ❞\n\n` +
        `✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n` +
        `┌──═━┈━═──┐\n\n` +
        `➻ 𝐍𝐀ɱɘ ✦  ${senderName}\n\n` +
        `➻ 𝐍𝐀ɱɘ ✦  ${partnerName}\n\n` +
        `└──═━┈━═──┘\n\n` +
        `✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n` +
        `🌸🍁 𝐘𝐎𝐔𝐑 𝐋𝐎𝐕𝐄 𝐋𝐄𝐕𝐄𝐋 💝 : ╰┈➤ ${loveLevel}%\n\n` +
        `${senderName} 🌺 ${partnerName}`;

      api.sendMessage(
        {
          body,
          attachment: fs.createReadStream(outputPath),
          mentions: [
            { tag: senderName, id: senderID },
            { tag: partnerName, id: partnerID }
          ]
        },
        threadID,
        () => { try { fs.unlinkSync(outputPath); } catch {} },
        messageID
      );

    } catch (err) {
      console.error("[pair]", err);
      send.reply("❌ Pair banana fail ho gaya: " + err.message);
    }
  }
};
