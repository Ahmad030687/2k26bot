const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cacheDir = path.join(__dirname, '..', 'cache', 'removebg');

module.exports = {
    'config': {
        'credits': 'SARDAR RDX',
        'name': 'removebg',
        'aliases': ['rmbg', 'nobg', 'bgremove'],
        'description': 'Kisi bhi photo ka background hata do.',
        'usage': 'removebg (image attach karo ya reply karo)',
        'category': 'tools',
        'prefix': true,
        'adminOnly': false,
        'cooldowns': 10
    },
    async 'run'({ api, event, send }) {
        const { threadID, messageID, messageReply } = event;
        let imageURL = null;

        const findImage = (attachments) => {
            if (!attachments?.length) return null;
            for (const att of attachments) {
                if (att.type === 'photo' || att.type === 'image' || att.type === 'sticker') {
                    return att.url || att.previewUrl || att.largeImage || null;
                }
            }
            return null;
        };

        imageURL = findImage(event.attachments);
        if (!imageURL && messageReply) {
            imageURL = findImage(messageReply.attachments);
        }

        if (!imageURL) {
            return send(
                '╭──── 🖼️ REMOVE BG ────╮\n' +
                '│\n' +
                '│  Photo ka background\n' +
                '│  hata deta hai!\n' +
                '│\n' +
                '│  📌 Kaise use karein:\n' +
                '│  1. Kisi photo pe reply\n' +
                '│     karke .removebg bhejo\n' +
                '│  2. Ya photo ke saath\n' +
                '╰────────────────────╯'
            );
        }

        const waitMsg = await api.sendMessage('🔄 Background hata raha hun...\n⏳ Thoda wait karo...', threadID);
        const waitMsgID = waitMsg?.messageID;

        try {
            const response = await axios.get('https://anabot.my.id/api/ai/removebg', {
                'params': {
                    'imageUrl': imageURL,
                    'apikey': 'freeApikey'
                },
                'headers': {
                    'accept': 'application/json'
                },
                'timeout': 60000,
                'validateStatus': () => true
            });

            if (response.status !== 200 || !response.data?.status || !response.data?.result) {
                try {
                    api.unsendMessage(waitMsgID);
                } catch {}
                return send('❌ Background nahi hata saka. Koi aur photo try karo.');
            }

            const resultImgUrl = response.data.result;
            console.log('[removebg] Result: ' + resultImgUrl);

            fs.mkdirSync(cacheDir, { 'recursive': true });
            const filePath = path.join(cacheDir, 'rmbg_' + Date.now() + '.png');
            
            const imgResponse = await axios.get(resultImgUrl, {
                'responseType': 'arraybuffer',
                'timeout': 30000,
                'headers': {
                    'User-Agent': 'Mozilla/5.0'
                },
                'maxRedirects': 5
            });

            if (!imgResponse.data || imgResponse.data.byteLength < 100) {
                try {
                    api.unsendMessage(waitMsgID);
                } catch {}
                return send('❌ Result image empty aayi. Dobara try karo.');
            }

            fs.writeFileSync(filePath, Buffer.from(imgResponse.data));

            try {
                api.unsendMessage(waitMsgID);
            } catch {}

            await api.sendMessage({
                'body': '✅ 𝐁𝐚𝐜𝐤𝐠𝐫𝐨𝐮𝐧𝐝 𝐇𝐚𝐭𝐚 𝐃𝐢𝐲𝐚!\n' +
                        '━━━━━━━━━━━━━━━━━━━\n' +
                        '🖼️ Format : PNG (Transparent)\n' +
                        '🤖 AI     : Gemini Powered\n' +
                        '━━━━━━━━━━━━━━━━━━━\n' +
                        '✅ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓',
                'attachment': fs.createReadStream(filePath)
            }, threadID, () => {
                try {
                    fs.unlinkSync(filePath);
                } catch {}
            }, messageID);

        } catch (err) {
            console.error('[removebg] Error:', err.message);
            try {
                api.unsendMessage(waitMsgID);
            } catch {}
            send('❌ Error: ' + err.message);
        }
    }
};
