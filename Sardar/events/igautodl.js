/**
 * Instagram Auto Downloader Bot Script
 * Decoded and customized with AHMAD RDX branding
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'instagram');

const frames = [
    "📥 Media download ho raha hai...\n\n⏳▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  0%",
    "📥 Media download ho raha hai...\n\n⏳▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒  25%",
    "📥 Media download ho raha hai...\n\n⏳▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒  55%",
    "📥 Media download ho raha hai...\n\n⏳▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒  80%",
    "✅ Media download ho gaya!"
];

function extractIgUrl(text) {
    const match = text.match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories\/[^/\s?]+)\/([A-Za-z0-9_\-]+)/i);
    if (!match) return null;
    return `https://www.instagram.com/${match[2]}/${match[3]}/`;
}

async function tryCobalt(url) {
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            'url': url,
            'vQuality': '720',
            'isNoTTWatermark': true
        }, {
            'headers': {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            'timeout': 25000,
            'validateStatus': () => true
        });

        if (response.status !== 200) return null;
        const data = response.data;
        if (data?.status === 'stream' && data?.url) {
            return [{ 'url': data.url, 'isVideo': true }];
        }
        if (data?.status === 'picker' && Array.isArray(data?.picker)) {
            return data.picker.map(item => ({
                'url': item.url,
                'isVideo': item.type === 'video'
            }));
        }
        if (data?.status === 'redirect' && data?.url) {
            return [{ 'url': data.url, 'isVideo': true }];
        }
    } catch (e) {
        console.log('[AHMAD RDX] Cobalt error:', e.message);
    }
    return null;
}

async function tryAnabot(url) {
    try {
        const response = await axios.get('https://anabot.xyz/api/download/instagram', {
            'params': { 'url': url, 'apikey': 'anabot' },
            'headers': { 'accept': 'application/json' },
            'timeout': 20000,
            'validateStatus': () => true
        });
        if (response.status !== 200 || !Array.isArray(response.data?.result?.data)) return null;
        return response.data.result.data.map(item => ({
            'url': item.url || item.link
        }));
    } catch (e) {
        console.log('[AHMAD RDX] Anabot error:', e.message);
    }
    return null;
}

async function trySnapinsta(url) {
    try {
        const response = await axios.post('https://snapinsta.app/action.php', `url=${encodeURIComponent(url)}`, {
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://snapinsta.app/'
            },
            'timeout': 20000,
            'validateStatus': () => true
        });
        if (response.status !== 200 || !response.data?.data) return null;
        const results = [];
        return results.length ? results : null;
    } catch (e) {
        console.log('[AHMAD RDX] Snapinsta error:', e.message);
    }
    return null;
}

module.exports = {
    'config': {
        'credits': 'SARDAR RDX', // Bilkul safe rakha gaya hai jaisa aapne kaha
        'name': 'igautodl',
        'eventType': 'message',
        'description': 'Instagram auto video/photo downloader by AHMAD RDX'
    },
    async 'run'({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;
        if (!body.includes('instagram.com')) return;

        const igUrl = extractIgUrl(body);
        if (!igUrl) return;

        const initialMsg = await api.sendMessage(frames[0], threadID);
        const msgID = initialMsg?.messageID;

        try {
            await api.editMessage(frames[1], msgID, threadID);
            let mediaList = null;

            try {
                mediaList = await tryCobalt(igUrl);
            } catch (err) {
                console.log('[AHMAD RDX] Cobalt catch err:', err.message);
            }

            if (!mediaList) {
                try {
                    mediaList = await tryAnabot(igUrl);
                } catch (err) {
                    console.log('[AHMAD RDX] Anabot catch err:', err.message);
                }
            }

            if (!mediaList) {
                try {
                    mediaList = await trySnapinsta(igUrl);
                } catch (err) {
                    console.log('[AHMAD RDX] Snapinsta catch err:', err.message);
                }
            }

            if (!mediaList || mediaList.length === 0) {
                await api.editMessage('❌ Media download nahi ho saki.', msgID, threadID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await api.editMessage(frames[2], msgID, threadID);
            fs.mkdirSync(cacheDir, { 'recursive': true });

            const attachments = [];
            for (let i = 0; i < Math.min(mediaList.length, 10); i++) {
                const item = mediaList[i];
                if (!item?.url) continue;
                const isVideo = item.isVideo || item.url.includes('.mp4');
                const ext = isVideo ? 'mp4' : 'jpg';
                const filePath = path.join(cacheDir, `ig_${Date.now()}_${i}.${ext}`);

                try {
                    const fileRes = await axios.get(item.url, {
                        'responseType': 'arraybuffer',
                        'timeout': 90000,
                        'headers': { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.instagram.com/' }
                    });
                    if (fileRes.data?.byteLength > 1000) {
                        fs.writeFileSync(filePath, Buffer.from(fileRes.data));
                        attachments.push(filePath);
                    }
                } catch (err) {
                    console.log(`[AHMAD RDX] File download error at index ${i}:`, err.message);
                }
            }

            if (attachments.length === 0) {
                await api.editMessage('❌ Media file save nahi ho saki.', msgID, threadID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await api.editMessage(frames[3], msgID, threadID);
            await api.editMessage(frames[4], msgID, threadID);
            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseBody = `🖼️ Files : ${attachments.length}\n🤖 Powered by AHMAD RDX`;
            api.sendMessage({
                'body': responseBody,
                'attachment': attachments.map(file => fs.createReadStream(file))
            }, threadID, () => {
                attachments.forEach(file => {
                    try { fs.unlinkSync(file); } catch {}
                });
                try { api.unsendMessage(msgID); } catch {}
            }, messageID);

        } catch (err) {
            console.log('[AHMAD RDX] Main execution error:', err.message);
            try {
                await api.sendMessage('❌ Error: ' + err.message, msgID, threadID);
            } catch {}
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
