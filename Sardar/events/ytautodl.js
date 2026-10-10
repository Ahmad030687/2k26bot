const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'ytautodl');

const frames = [
    '🔍 YouTube link detect hua!\n\n⌛▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒  10%',
    '⚙️ Processing video...\n\n⏳▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒  55%',
    '📦 File ready ho raha hai...\n\n⏳▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒  90%',
    '❌ YouTube video download nahi ho saka. Link check karo ya thodi der baad try karo.',
    '⚠️ Video file ka size bohat chota hai ya download fail ho gaya.',
    '[ytautodl] Error: '
];

function extractYtUrl(text) {
    const match = text.match(/https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_\-]{11})[^\s]*/i);
    if (!match) return null;
    return match[0].split(' ')[0];
}

async function getDownloadUrl(videoUrl, format) {
    try {
        const response = await axios.get('https://loader.to/ajax/download.php', {
            params: {
                'format': format,
                'url': videoUrl
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Referer': 'https://loader.to/'
            },
            timeout: 20000,
            validateStatus: () => true
        });

        if (!response.data || !response.data.success || !response.data.id) {
            return null;
        }

        const downloadId = response.data.id;
        console.log('[AHMAD RDX - ytautodl] Progress ID: ' + downloadId + ' (' + format + ')');

        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const progressRes = await axios.get('https://loader.to/ajax/progress.php', {
                params: {
                    'id': downloadId
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Referer': 'https://loader.to/'
                },
                timeout: 15000,
                validateStatus: () => true
            });

            const progressData = progressRes.data;
            console.log('[AHMAD RDX] Progress: ' + (progressData?.progress || 0) + '/1000');

            if (progressData?.success === 1 && progressData?.download_url) {
                return progressData.download_url;
            }
            if (progressData?.progress === 1000 && progressData?.download_url) {
                return progressData.download_url;
            }
        }
    } catch (err) {
        console.error('[AHMAD RDX] getDownloadUrl error:', err.message);
    }
    return null;
}

module.exports = {
    'config': {
        'credits': 'SARDAR RDX',
        'name': 'ytautodl',
        'eventType': 'message',
        'description': 'YouTube video aur shorts download karne ke liye command'
    },
    async 'run'({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;

        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        if (!body.includes('youtube.com') && !body.includes('youtu.be')) return;

        const ytUrl = extractYtUrl(body);
        if (!ytUrl) return;

        console.log('[AHMAD RDX - ytautodl] Detected URL: ' + ytUrl);

        const sentMsg = await api.sendMessage(frames[0], threadID);
        const messageIdToEdit = sentMsg?.messageID;

        try {
            await api.editMessage(frames[1], messageIdToEdit, threadID);

            let downloadUrl = null;
            for (const format of ['360', '720', '1080']) {
                try {
                    downloadUrl = await getDownloadUrl(ytUrl, format);
                    if (downloadUrl) {
                        console.log('[AHMAD RDX] Successful format: ' + format + 'p');
                        break;
                    }
                } catch (err) {
                    console.log('[AHMAD RDX] Format ' + format + ' error: ' + err.message);
                }
            }

            if (!downloadUrl) {
                await api.editMessage(frames[3], messageIdToEdit, threadID);
                return;
            }

            await api.editMessage(frames[2], messageIdToEdit, threadID);
            fs.mkdirSync(cacheDir, { 'recursive': true });

            const filePath = path.join(cacheDir, 'yt_' + Date.now() + '.mp4');

            const videoResponse = await axios.get(downloadUrl, {
                'responseType': 'arraybuffer',
                'timeout': 180000,
                'headers': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Referer': 'https://loader.to/'
                },
                'maxRedirects': 10
            });

            if (!videoResponse.data || videoResponse.data.byteLength < 10000) {
                await api.editMessage(frames[4], messageIdToEdit, threadID);
                return;
            }

            fs.writeFileSync(filePath, Buffer.from(videoResponse.data));

            const fileSizeMB = (videoResponse.data.byteLength / 1024 / 1024).toFixed(2);
            console.log('[AHMAD RDX] Saved file size: ' + fileSizeMB + ' MB');

            await api.editMessage('📦 File ready ho raha hai...\n\n⏳▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒  90%', messageIdToEdit, threadID);
            await api.editMessage('✅ Video successfully downloaded!', messageIdToEdit, threadID);
            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseMessage = 
                '🤖 **AHMAD RDX - YOUTUBE DOWNLOADER**\n\n' +
                '🔗 **Link** : ' + ytUrl.slice(0, 50) + (ytUrl.length > 50 ? '...' : '') + '\n' +
                '💾 **Size** : ' + fileSizeMB + ' MB\n' +
                '━━━━━━━━━━━━━━━━━━━━\n' +
                '✨ Powered by AHMAD RDX';

            api.sendMessage({
                'body': responseMessage,
                'attachment': fs.createReadStream(filePath)
            }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch {}
                try { api.unsendMessage(messageIdToEdit); } catch {}
            }, messageID);

        } catch (err) {
            console.error('[AHMAD RDX] Error in execution:', err.message);
            try {
                await api.editMessage(frames[5] + err.message, messageIdToEdit, threadID);
            } catch {}
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
