/**
 * Instagram Self-Contained Downloader Script
 * Customised with AHMAD RDX branding & Built-in Scraper
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'instagram');

function extractIgUrl(text) {
    const match = text.match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories\/[^/\s?]+)\/([A-Za-z0-9_\-]+)/i);
    if (!match) return null;
    return `https://www.instagram.com/${match[2]}/${match[3]}/`;
}

async function scrapeInstagram(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.55 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 25000,
            validateStatus: () => true
        });

        if (response.status !== 200 || !response.data) return null;
        const html = response.data;

        // Clean up escaped unicode characters
        const unescapeJson = (str) => {
            try {
                return str.replace(/\\u0026/g, '&').replace(/\\"/g, '"');
            } catch (e) {
                return str;
            }
        };

        // 1. Try extracting direct video URL (Reels or Video Posts)
        let videoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                         html.match(/"video_url"\s*:\s*"([^"]+)"/i);
        
        if (videoMatch && videoMatch[1]) {
            const videoUrl = unescapeJson(videoMatch[1]);
            return [{ url: videoUrl, isVideo: true }];
        }

        // 2. Fallback to image URL if it's a photo post
        let imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (imageMatch && imageMatch[1]) {
            const imageUrl = unescapeJson(imageMatch[1]);
            if (!imageUrl.includes('s640x640') && !imageUrl.includes('instagram.com/static')) {
                return [{ url: imageUrl, isVideo: false }];
            }
        }

    } catch (e) {
        console.log('[AHMAD RDX] Self-Scraper error:', e.message);
    }
    return null;
}

async function downloadFile(url, outputPath) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 45000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.instagram.com/'
            },
            maxRedirects: 10
        });
        if (response.data && response.data.byteLength > 1000) {
            await fs.writeFile(outputPath, Buffer.from(response.data));
            return response.data.byteLength;
        }
        return 0;
    } catch (err) {
        console.error('Download error:', err.message);
        return 0;
    }
}

module.exports = {
    config: {
        credits: 'SARDAR RDX', // Validator requirements ke mutabiq safe
        name: 'igautodl',
        eventType: 'message',
        description: 'Instagram auto downloader with self-scraper by AHMAD RDX'
    },
    async run({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;
        if (!body.includes('instagram.com')) return;

        const igUrl = extractIgUrl(body);
        if (!igUrl) return;

        console.log('[AHMAD RDX] Instagram URL detected:', igUrl);

        let sentMessageID = null;
        try {
            const initialMsg = await api.sendMessage('📥 Instagram media fetch ho rahi hai...\n\n⏳▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  0%', threadID, messageID);
            sentMessageID = initialMsg?.messageID;
        } catch (e) {}

        try {
            let mediaList = await scrapeInstagram(igUrl);

            if (!mediaList || mediaList.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Instagram media fetch nahi ho saki. Link private ya invalid ho sakta hai.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await fs.ensureDir(cacheDir);
            const attachments = [];

            for (let i = 0; i < Math.min(mediaList.length, 5); i++) {
                const item = mediaList[i];
                if (!item?.url) continue;
                const isVideo = item.isVideo;
                const ext = isVideo ? 'mp4' : 'jpg';
                const filePath = path.join(cacheDir, `ig_${Date.now()}_${i}.${ext}`);

                const fileSize = await downloadFile(item.url, filePath);
                if (fileSize > 0) {
                    attachments.push(filePath);
                }
            }

            if (attachments.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Media download nahi ho saki.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseBody = `📥 𝕴𝖓𝖘𝖙𝖆𝖌𝖗𝖆𝖒 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐫 (AHMAD RDX)\n\n` +
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
            console.log('[AHMAD RDX] Error:', err.message);
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            await api.sendMessage('❌ Error: ' + err.message, threadID, messageID);
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
