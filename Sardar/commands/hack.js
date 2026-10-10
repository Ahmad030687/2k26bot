const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function makeHackImage(targetID, targetName) {
  const W = 600, H = 400;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Green matrix-style scanlines
  ctx.fillStyle = 'rgba(0, 255, 70, 0.04)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // Border glow
  ctx.strokeStyle = '#00ff46';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff46';
  ctx.shadowBlur = 18;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.shadowBlur = 0;

  // Header bar
  ctx.fillStyle = '#001a00';
  ctx.fillRect(8, 8, W - 16, 44);
  ctx.strokeStyle = '#00ff46';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, 44);

  // Header title
  ctx.fillStyle = '#00ff46';
  ctx.font = 'bold 18px monospace';
  ctx.shadowColor = '#00ff46';
  ctx.shadowBlur = 8;
  ctx.fillText('[ HACK TERMINAL v2.0 ]', 20, 36);
  ctx.shadowBlur = 0;

  // Close buttons (fake)
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(W - 30 - i * 22, 30, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Try to load profile picture
  let avatarLoaded = false;
  try {
    const avtURL = `https://graph.facebook.com/${targetID}/picture?width=100&height=100&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avtRes = await axios.get(avtURL, { responseType: 'arraybuffer', timeout: 8000 });
    const avtImg = await loadImage(Buffer.from(avtRes.data));

    // Circle clip for avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(70, 130, 48, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avtImg, 22, 82, 96, 96);
    ctx.restore();

    // Ring around avatar
    ctx.strokeStyle = '#00ff46';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff46';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(70, 130, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    avatarLoaded = true;
  } catch {}

  const textX = avatarLoaded ? 145 : 20;

  // Target name
  ctx.fillStyle = '#00ff46';
  ctx.font = 'bold 20px monospace';
  ctx.shadowColor = '#00ff46';
  ctx.shadowBlur = 6;
  ctx.fillText(`> TARGET: ${targetName}`, textX, 90);
  ctx.shadowBlur = 0;

  // Terminal lines
  const lines = [
    { text: '> Scanning IP address...', delay: 0, color: '#00cc38' },
    { text: '  IP: 192.168.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255) + ' [FOUND]', delay: 1, color: '#00ff46' },
    { text: '> Bypassing firewall...', delay: 2, color: '#00cc38' },
    { text: '  Status: BYPASSED ✓', delay: 3, color: '#00ff46' },
    { text: '> Accessing database...', delay: 4, color: '#00cc38' },
    { text: '  Records: ' + (Math.floor(Math.random() * 900) + 100) + ' files LEAKED ✓', delay: 5, color: '#00ff46' },
    { text: '> Extracting password hash...', delay: 6, color: '#00cc38' },
    { text: '  Hash: $2y$10$' + Math.random().toString(36).substr(2, 22).toUpperCase(), delay: 7, color: '#ff4444' },
    { text: '> HACK COMPLETE — 100%', delay: 8, color: '#ff4444' },
  ];

  ctx.font = '13px monospace';
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color;
    if (line.color === '#ff4444') {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 6;
    }
    ctx.fillText(line.text, textX, 120 + i * 22);
    ctx.shadowBlur = 0;
  });

  // Progress bar
  const barY = 330;
  ctx.fillStyle = '#001a00';
  ctx.fillRect(20, barY, W - 40, 22);
  ctx.strokeStyle = '#00ff46';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, barY, W - 40, 22);

  ctx.fillStyle = '#00ff46';
  ctx.shadowColor = '#00ff46';
  ctx.shadowBlur = 8;
  ctx.fillRect(22, barY + 2, W - 44, 18);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('█████████████████████ 100% COMPLETE', 30, barY + 16);

  // Footer
  ctx.fillStyle = '#003300';
  ctx.fillRect(8, H - 44, W - 16, 36);
  ctx.strokeStyle = '#00ff46';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, H - 44, W - 16, 36);

  ctx.fillStyle = '#00ff46';
  ctx.font = '12px monospace';
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  ctx.fillText(`> Session: ${targetID} | Time: ${now} | Status: SUCCESS`, 18, H - 22);

  return canvas.toBuffer('image/png');
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: "hack",
    aliases: ["hk", "hacker"],
    description: "Kisi ka virtual 'hack' prank karo — fun only!",
    usage: "hack [@mention / reply]",
    category: "Fun",
    prefix: true,
    cooldowns: 5
  },

  async run({ api, event, send, Users, config }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID = null;
    const mentionKeys = Object.keys(mentions || {});
    if (mentionKeys.length > 0) {
      targetID = mentionKeys[0];
    } else if (messageReply) {
      targetID = messageReply.senderID;
    } else {
      targetID = senderID;
    }

    const getNameFromApi = (userId) =>
      new Promise((resolve) => {
        try {
          api.getUserInfo(userId, (err, info) => {
            if (err || !info?.[userId]?.name) return resolve(null);
            resolve(info[userId].name);
          });
        } catch {
          resolve(null);
        }
      });

    try {
      api.setMessageReaction("💻", messageID, () => {}, true);
    } catch {}

    send.reply(
      `╭─ « 💻 𝐇𝐀𝐂𝐊 𝐒𝐓𝐀𝐑𝐓𝐄𝐃 » ─⟡\n│\n│ 🔍 Target scan ho raha hai...\n│ ⚡ System access ho raha hai...\n│ 🛡️ Firewall bypass...\n│\n│ ⏳ Kuch second ruko!\n│\n╰───────────────⟡`
    );

    try {
      let targetName = await getNameFromApi(targetID);
      if (!targetName && typeof Users?.getNameUser === "function") {
        targetName = await Users.getNameUser(targetID).catch(() => null);
      }
      if (!targetName) targetName = "Unknown";

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const imgPath = path.join(cacheDir, `hack_${Date.now()}.png`);

      const imgBuffer = await makeHackImage(targetID, targetName);
      await fs.writeFile(imgPath, imgBuffer);

      await new Promise((resolve, reject) => {
        api.sendMessage(
          {
            body:
              `╭─── « 💀 𝐇𝐀𝐂𝐊 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 » ───⟡\n` +
              `│\n` +
              `│ 🎯 Target  : ${targetName}\n` +
              `│ 🔐 Password: ••••••••••\n` +
              `│ 📧 Data    : LEAKED ✅\n` +
              `│\n` +
              `│ ⚠️ Owner ko bhej diya gaya!\n` +
              `│ 😈 Next time careful rehna!\n` +
              `│\n` +
              `│ 💻 — ${config?.AI_OWNER || 'AHMAD RDX'} BOT\n` +
              `╰───────────────⟡`,
            attachment: fs.createReadStream(imgPath),
            mentions: [{ tag: targetName, id: targetID }]
          },
          threadID,
          async (err, info) => {
            await fs.unlink(imgPath).catch(() => {});
            if (err) return reject(err);
            resolve(info);
          },
          messageID
        );
      });
    } catch (err) {
      console.error("[hack]", err);
      send.reply(
        `╭─── « ❌ HACK FAILED » ───⟡\n│\n│ ⚠️ Hack karna fail ho gaya!\n│ ${err.message?.slice(0, 80) || "Unknown error"}\n│\n│ 🔄 Dobara try karo!\n│\n╰───────────────⟡`
      );
    }
  }
};
