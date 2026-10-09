const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "..", "cache", "emojigif");

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: "emojigif",
    aliases: ["egif", "emojig", "gifemoji"],
    description: "Emoji ko animated GIF mein convert karo.",
    usage: "emojigif [emoji]",
    category: "Fun",
    prefix: true,
    adminOnly: false,
    cooldowns: 5
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID } = event;

    const emote = args[0] || "";
    if (!emote.trim()) {
      return send.reply(
        `╭──── 🎭 EMOJI GIF ────╮\n` +
        `│\n` +
        `│  Emoji ka animated GIF\n` +
        `│  banata hai!\n` +
        `│\n` +
        `│  📌 Usage:\n` +
        `│  .emojigif 😭\n` +
        `│  .emojigif 🔥\n` +
        `│  .emojigif 😂\n` +
        `│  .emojigif 💀\n` +
        `│\n` +
        `╰────────────────────╯`
      );
    }

    const statusMsg = await api.sendMessage(`🎭 ${emote} GIF bana raha hun...`, threadID);
    const sid = statusMsg?.messageID;

    try {
      const apiRes = await axios.get("https://anabot.my.id/api/maker/emojiGif", {
        params: { emote, apikey: "freeApikey" },
        headers: { accept: "application/json" },
        timeout: 30000,
        validateStatus: () => true
      });

      if (apiRes.status !== 200 || !apiRes.data?.success || !apiRes.data?.data?.result) {
        try { api.unsendMessage(sid); } catch {}
        return send.reply("❌ GIF nahi ban saka. Koi emoji try karo jaise 😭 🔥 😂");
      }

      const gifUrl = apiRes.data.data.result;
      console.log(`[emojigif] URL: ${gifUrl}`);

      const ext = gifUrl.split('.').pop().split('?')[0] || "gif";
      fs.mkdirSync(cacheDir, { recursive: true });
      const filePath = path.join(cacheDir, `emojigif_${Date.now()}.${ext}`);

      const dlRes = await axios.get(gifUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: { "User-Agent": "Mozilla/5.0" },
        maxRedirects: 5
      });

      if (!dlRes.data || dlRes.data.byteLength < 100) {
        try { api.unsendMessage(sid); } catch {}
        return send.reply("❌ GIF file empty aayi. Dobara try karo.");
      }

      fs.writeFileSync(filePath, Buffer.from(dlRes.data));

      try { api.unsendMessage(sid); } catch {}

      api.sendMessage(
        {
          body: `🎭 ${emote} Emoji GIF\n✅ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => { try { fs.unlinkSync(filePath); } catch {} },
        messageID
      );

    } catch (err) {
      console.error("[emojigif] Error:", err.message);
      try { api.unsendMessage(sid); } catch {}
      send.reply("❌ Error: " + err.message);
    }
  }
};
