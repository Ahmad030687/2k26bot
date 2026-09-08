const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "uptime",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "Bot dashboard ka live snapshot",
    commandCategory: "system",
    usages: "",
    cooldowns: 15
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;
    
    // 🔗 APNA URL AUR KEY
    const targetUrl = "http://51.83.6.7:20054"; 
    const apiKey = "61924e"; 
    
    const header = "┏━━━━━━━ ✵ ━━━━━━━┓\n       𝗥𝗗𝗫 𝗦𝗬𝗦𝗧𝗘𝗠 𝗨𝗣𝗧𝗜𝗠𝗘\n┗━━━━━━━ ✵ ━━━━━━━┛";
    const footer = "⚡ 𝗔𝗵𝗺𝗮𝗱 𝗔𝗹𝗶 𝗦𝗮𝗳𝗱𝗮𝗿";

    api.sendMessage(`📸 [ 𝗔𝗛𝗠𝗔𝗗 𝗥𝗗𝗫 ]\n──────────────────\nUstad, live uptime capture ho raha hai, thora sabar karein...`, threadID, messageID);

    try {
        // 'cacheLimit=0' add kiya hai taake purani image na aaye
        const snapshotUrl = `https://api.screenshotmachine.com/?key=${apiKey}&url=${encodeURIComponent(targetUrl)}&dimension=1920x1080&cacheLimit=0&format=png`;

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);
        const imagePath = path.join(cacheDir, `uptime_fresh.png`);

        const res = await axios.get(snapshotUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(imagePath, Buffer.from(res.data));

        return api.sendMessage({
            body: `${header}\n━━━━━━━━━━━━━━━━━━━\n✅ 𝗦𝗧𝗔𝗧𝗨𝗦: Dashboard Live\n🕒 𝗨𝗣𝗧𝗜𝗠𝗘: Checking Panel...\n━━━━━━━━━━━━━━━━━━━\n${footer}`,
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => {
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }, messageID);

    } catch (e) {
        return api.sendMessage("❌ Error: Snapshot lene mein masla aaya. Shayad Katabump link down hai.", threadID, messageID);
    }
};