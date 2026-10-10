const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'vidgen');
const frames = [
    '🎬 Video generate ho rahi hai...\n\n⌛▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒  10%',
    '🎞️ Scenes bana raha hai...\n\n⏳▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒  50%',
    '📦 File ready ho rahi hai...\n\n⏳▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒  90%',
    '📥 Video render ho rahi hai...\n\n⏳▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒  70%',
    '🤖 AI prompt process kar raha hai...\n\n⌛▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒  30%',
    '✅ Complete!\n\n🟢▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% 😍'
];

module.exports = {
    config: {
        credits: 'SARDAR RDX',
        name: 'vidgen',
        aliases: ['t2v', 'makevideo', 'text2video'],
        description: 'Text se AI video generate karo.',
        usage: 'text2video [prompt]',
        category: 'AI',
        prefix: true,
        adminOnly: false,
        cooldowns: 30
    },
    async run({ api, event, args, send }) {
        const { threadID, messageID } = event;
        if (!args[0]) {
            return send(
                '╭──── 🎬 TEXT2VIDEO ────╮\n' +
                '│  Text se AI video\n' +
                '│  generate karta hai!\n' +
                '│\n' +
                '│  📌 Usage:\n' +
                '│  text2video [prompt]\n' +
                '│  📌 Examples:\n' +
                '│  • .text2video cat playing\n' +
                '│              football\n' +
                '│  💡 Tips:\n' +
                '│  • Short & clear likho\n' +
                '│  • English prompt dalo\n' +
                '╰────────────────────╯'
            );
        }

        const prompt = args.join(' ');
        const initialMessage = await api.sendMessage(frames[0], threadID);
        const messageId = initialMessage?.messageID;

        try {
            await api.editMessage(frames[1], messageId, threadID);
            const response = await axios.get('https://anabot.my.id/api/ai/text2video', {
                params: {
                    'prompt': prompt,
                    'apikey': 'freeApikey'
                },
                headers: {
                    'accept': 'application/json'
                },
                timeout: 120000,
                validateStatus: () => true
            });

            if (response.status !== 200 || !response.data?.success || !response.data?.result?.url) {
                try {
                    api.unsendMessage(messageId);
                } catch {}
                return send('❌ Video generate nahi ho saki. Thoda aur wait karke dobara try karo.');
            }

            const videoUrl = response.data.result.url;
            console.log('[text2video] URL: ' + videoUrl);

            await api.editMessage(frames[2], messageId, threadID);
            fs.mkdirSync(cacheDir, { 'recursive': true });

            const filePath = path.join(cacheDir, 't2v_' + Date.now() + '.mp4');
            await api.editMessage(frames[3], messageId, threadID);

            const videoResponse = await axios.get(videoUrl, {
                'responseType': 'arraybuffer',
                'timeout': 120000,
                'headers': {
                    'User-Agent': 'Mozilla/5.0'
                },
                'maxRedirects': 5
            });

            if (!videoResponse.data || videoResponse.data.byteLength < 1000) {
                try {
                    api.unsendMessage(messageId);
                } catch {}
                return send('❌ Video file empty aayi. Dobara try karo.');
            }

            const fileSizeMB = (videoResponse.data.byteLength / 1024 / 1024).toFixed(2);
            fs.writeFileSync(filePath, Buffer.from(videoResponse.data));
            console.log('[text2video] Saved: ' + fileSizeMB + ' MB');

            await api.editMessage(frames[4], messageId, threadID);
            await api.editMessage(frames[5], messageId, threadID);

            api.setMessageReaction('✅', messageID, () => {}, true);

            api.sendMessage({
                'body': '🎬 𝐀𝐈 𝐕𝐢𝐝𝐞𝐨 𝐑𝐞𝐚𝐝𝐲!\n' +
                        '━━━━━━━━━━━━━━━━━━━━\n' +
                        ('📝 𝐏𝐫𝐨𝐦𝐩𝐭 : ' + prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '') + '\n') +
                        ('📦 𝐒𝐢𝐳𝐞   : ' + fileSizeMB + ' MB\n') +
                        '🤖 𝐀𝐈     : Gemini Powered\n' +
                        '✅ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓',
                'attachment': fs.createReadStream(filePath)
            }, threadID, () => {
                try {
                    fs.unlinkSync(filePath);
                } catch {}
                try {
                    api.unsendMessage(messageId);
                } catch {}
            }, messageID);

        } catch (error) {
            console.log('[text2video] Error: ', error.message);
            try {
                api.editMessage('❌ Error: ' + error.message, messageId, threadID);
            } catch {}
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
