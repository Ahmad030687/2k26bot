const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'tiktok');

function extractTikTokUrl(text) {
    const match = text.match(/https?:\/\/(www\.|vt\.|vm\.|m\.)?tiktok\.com\/[^\s]*/i);
    if (!match) return null;
    return match[0].split(' ')[0];
}

async function downloadFile(url, outputPath) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 45000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://www.tiktok.com/'
            },
            maxRedirects: 10
        });
        if (response.data && response.data.byteLength > 10000) {
            await fs.writeFile(outputPath, Buffer.from(response.data));
            return response.data.byteLength;
        }
        return 0;
    } catch (err) {
        console.error('Download error: ' + err.message);
        return 0;
    }
}

module.exports = {
    config: {
        credits: 'SARDAR RDX', // Safe validator format
        name: 'AHMAD RDX',
        eventType: 'message',
        description: 'TikTok video downloader by AHMAD RDX'
    },
    async run({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;

        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        const tiktokUrl = extractTikTokUrl(body);
        if (!tiktokUrl) return;

        console.log('[AHMAD RDX] Extracted URL: ' + tiktokUrl);

        let sentMessageID = null;
        try {
            const infoMsg = await api.sendMessage('📡 Video info fetch ho rahi hai...\n\n⌛▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒  30%', threadID, messageID);
            sentMessageID = infoMsg?.messageID;
        } catch (e) {
            console.error('Failed to send initial status:', e);
        }

        try {
            const apiUrl = 'https://kojaxd-api.vercel.app/downloader/tiktok';
            const res = await axios.get(apiUrl, {
                params: {
                    apikey: 'Koja-5d5acdde3e2ab95585d4ebc888684266',
                    url: tiktokUrl
                },
                headers: { 'accept': 'application/json' },
                timeout: 30000,
                validateStatus: () => true
            });

            console.log('[AHMAD RDX] API Response Status:', res.status);

            if (res.status !== 200 || !res.data || res.data.code !== 0 || !res.data.data) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ TikTok video fetch nahi ho saka. Link valid nahi hai ya API limit poori ho gayi hai.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            const videoData = res.data.data;
            const username = videoData.author?.nickname || videoData.author?.unique_id || 'TikTok User';
            const caption = videoData.title || '';
            const videoUrl = videoData.play || videoData.wmplay;

            if (!videoUrl) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Video stream URL nahi mil saka.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await fs.ensureDir(cacheDir);
            const filePath = path.join(cacheDir, 'tiktok_' + Date.now() + '.mp4');

            const fileSize = await downloadFile(videoUrl, filePath);

            if (!fileSize) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Video download nahi ho saki.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
            console.log('[AHMAD RDX] Saved file size: ' + fileSizeMB + ' MB');

            // Remove loading message
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }

            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseText = `📥 𝕿𝖎𝖐𝕿𝖔𝖐 𝕯𝖔𝖜𝖓𝖑𝖔𝖆𝖉𝖊𝖗 (AHMAD RDX)\n\n` +
                `👤 𝐔𝐬𝐞𝐫    : ${username}\n` +
                (caption ? `📝 𝐂𝐚𝐩𝐭𝐢𝐨𝐧 : ${caption.substring(0, 80)}${caption.length > 80 ? '...' : ''}\n` : '') +
                `💾 𝐒𝐢𝐳𝐞    : ${fileSizeMB} MB\n\n` +
                `⚡ Powered by AHMAD RDX`;

            await api.sendMessage({
                body: responseText,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            }, messageID);

        } catch (err) {
            console.error('[AHMAD RDX] Error in TikTok Downloader:', err.message);
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            await api.sendMessage('❌ Error: ' + err.message, threadID, messageID);
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
