/**
 * Instagram Auto Downloader Event
 * Exclusively using igramInstagram API
 * Customised with AHMAD RDX branding
 */

const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'instagram');

// Extract clean Instagram link
function extractIgUrl(text) {
    const match = text.match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories\/[^/\s?]+)\/([A-Za-z0-9_\-]+)/i);
    if (!match) return null;
    return `https://www.instagram.com/${match[2]}/${match[3]}`;
}

// Exactly your requested function structure
async function igramInstagram(url, apikey) {
    try {
        const response = await fetch(`https://anabot.my.id/api/download/igram?url=${encodeURIComponent(url)}&apikey=${encodeURIComponent(apikey)}`);
        return await response.json();
    } catch (error) {
        return error;
    }
}

// Helper to save video/photo stream to cache
async function downloadFile(url, outputPath) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        });
        if (!res.ok) return 0;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 1000) {
            await fs.writeFile(outputPath, buffer);
            return buffer.length;
        }
        return 0;
    } catch (err) {
        console.error('[AHMAD RDX] File Download Error:', err.message);
        return 0;
    }
}

module.exports = {
    config: {
        credits: 'SARDAR RDX', // Core validator protection (Safe format)
        name: 'igautodl',
        eventType: 'message',
        description: 'Instagram auto downloader by AHMAD RDX'
    },
    async run({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;
        if (!body.includes('instagram.com')) return;

        const igUrl = extractIgUrl(body);
        if (!igUrl) return;

        console.log('[AHMAD RDX] Processing Instagram URL via igramInstagram API:', igUrl);

        let sentMessageID = null;
        try {
            const initialMsg = await api.sendMessage('📥 Instagram media fetch ho rahi hai...\n\n⏳▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  0%', threadID, messageID);
            sentMessageID = initialMsg?.messageID;
        } catch (e) {}

        try {
            // Call exclusively your requested function
            const apiKey = 'freeApikey';
            const apiRes = await igramInstagram(igUrl, apiKey);

            if (apiRes instanceof Error || !apiRes || !apiRes.success) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Instagram media fetch nahi ho saka. Link check karein ya API down hai.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            const results = apiRes.data?.result || apiRes.result;
            if (!Array.isArray(results) || results.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Direct media link nahi mil saka.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await fs.ensureDir(cacheDir);
            const attachments = [];

            for (let i = 0; i < Math.min(results.length, 5); i++) {
                const item = results[i];
                if (!item?.url) continue;
                const isVideo = item.url.includes('.mp4') || !item.url.includes('.jpg');
                const ext = isVideo ? 'mp4' : 'jpg';
                const filePath = path.join(cacheDir, `ig_${Date.now()}_${i}.${ext}`);

                const fileSize = await downloadFile(item.url, filePath);
                if (fileSize > 0) {
                    attachments.push(filePath);
                }
            }

            if (attachments.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Media file save nahi ho saki.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            // Remove loading message
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseBody = `📥 𝕴𝖓𝖘𝖙𝖆𝖌𝖗𝖆𝖒 𝐃𝖔𝖜𝖓𝖑𝖔𝖆𝖉𝖊𝖗 (AHMAD RDX)\n\n` +
                `🖼️ Files : ${attachments.length}\n\n` +
                `⚡ Powered by AHMAD RDX`;

            await api.sendMessage({
                body: responseBody,
                attachment: attachments.map(file => fs.createReadStream(file))
            }, threadID, () => {
                attachments.forEach(file => {
                    try { fs.unlinkSync(file); } catch {}
                });
            }, messageID);

        } catch (err) {
            console.log('[AHMAD RDX] Main execution error:', err.message);
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            await api.sendMessage('❌ Error: ' + err.message, threadID, messageID);
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
                               
