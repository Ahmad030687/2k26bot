/**
 * Project: AHMAD RDX Enhance Bot Command
 * Credits: SARDAR RDX
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'enhance');

module.exports = {
    'config': {
        'credits': 'SARDAR RDX',
        'name': 'AHMAD RDX',
        'aliases': ['hd', 'enhance', 'highdef'],
        'description': 'Photo ko HD aur saaf karne ke liye command',
        'usage': '[reply to photo or send photo]',
        'category': 'image',
        'prefix': true,
        'adminOnly': false,
        'cooldowns': 10
    },
    async 'run'({ api, event, send }) {
        const { threadID, messageID, messageReply } = event;
        let imageURL = null;

        const getPhotoUrl = (attachments) => {
            if (!attachments) return null;
            for (const att of attachments) {
                if (att.type === 'photo' || att.type === 'image') {
                    return att.url || att.previewUrl || att.uri || null;
                }
            }
            return null;
        };

        imageURL = getPhotoUrl(event.attachments);
        if (!imageURL && messageReply) {
            imageURL = getPhotoUrl(messageReply.attachments);
        }

        if (!imageURL) {
            return send(
                '╭──── ✨ ENHANCE ────╮\n' +
                '│\n' +
                '│  Photo ko HD aur\n' +
                '│  saaf karne ke liye:\n' +
                '│  1. Photo ke saath command likho\n' +
                '│  2. Ya kisi photo par reply karo\n' +
                '╰────────────────────╰'
            );
        }

        const processingMsg = await api.sendMessage('✨ Photo enhance ho rahi hai...\n⏳ Thoda wait karo...', threadID);
        const msgID = processingMsg?.messageID || processingMsg;

        try {
            const response = await axios.get('https://api.remini.ai/v1/enhance', {
                'params': {
                    'imageUrl': imageURL,
                    'apikey': 'default_key'
                },
                'headers': { 'accept': 'application/json' },
                'timeout': 60000,
                'validateStatus': () => true
            });

            if (response.status !== 200 || !response.data) {
                try { api.unsendMessage(msgID); } catch {}
                return send('❌ Photo enhance karne mein error aayi hai!');
            }

            const enhancedUrl = response.data.url || response.data.image;
            if (!enhancedUrl) {
                try { api.unsendMessage(msgID); } catch {}
                return send('❌ Enhanced image ka URL nahi mila!');
            }

            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { 'recursive': true });
            }

            const ext = enhancedUrl.split('.').pop().split('?')[0] || 'jpg';
            const filePath = path.join(cacheDir, 'enhance_' + Date.now() + '.' + ext);

            const imageDownload = await axios.get(enhancedUrl, {
                'responseType': 'arraybuffer',
                'timeout': 30000,
                'headers': { 'User-Agent': 'Mozilla/5.0' },
                'maxRedirects': 5
            });

            fs.writeFileSync(filePath, Buffer.from(imageDownload.data));

            try { api.unsendMessage(msgID); } catch {}

            await api.sendMessage({
                'body': '✨ Yeh lijiye aapki HD photo tayar hai!',
                'attachment': fs.createReadStream(filePath)
            }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch {}
            }, messageID);

        } catch (error) {
            console.error('[enhance] Error:', error.message);
            try { api.unsendMessage(msgID); } catch {}
            return send('❌ Ek error aa gayi hai: ' + error.message);
        }
    }
};
