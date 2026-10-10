/**
 * Instagram Self-Built API & Auto Downloader Script
 * No External APIs Required - Direct Instagram Query Engine
 * Customised with AHMAD RDX branding
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'cache', 'instagram');

// 1. Extract clean Instagram Post / Reel URL & Shortcode
function parseIgUrl(text) {
    const match = text.match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories\/[^/\s?]+)\/([A-Za-z0-9_\-]+)/i);
    if (!match) return null;
    return {
        fullUrl: `https://www.instagram.com/${match[2]}/${match[3]}/`,
        type: match[2],
        shortcode: match[3]
    };
}

// 2. SELF-BUILT INSTAGRAM SCRAPER API ENGINE
async function selfBuiltIgApi(shortcode, fullUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.55 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459', // Official IG Web App ID
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': fullUrl
    };

    // Method A: Direct GraphQL Web Query Engine
    try {
        const queryUrl = `https://www.instagram.com/graphql/query/?query_hash=b3055315caf7d2232bc8463469870052&variables=${encodeURIComponent(JSON.stringify({ shortcode: shortcode }))}`;
        const res = await axios.get(queryUrl, { headers, timeout: 15000, validateStatus: () => true });

        if (res.status === 200 && res.data?.data?.shortcode_media) {
            const media = res.data.data.shortcode_media;
            if (media.is_video && media.video_url) {
                return [{ url: media.video_url, isVideo: true }];
            }
            if (media.display_url) {
                return [{ url: media.display_url, isVideo: false }];
            }
        }
    } catch (e) {
        console.log('[AHMAD RDX] Self-API Method A failed:', e.message);
    }

    // Method B: Direct Internal API v1 Post Info Query
    try {
        const infoUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
        const res = await axios.get(infoUrl, { headers, timeout: 15000, validateStatus: () => true });

        if (res.status === 200 && res.data?.items?.[0]) {
            const item = res.data.items[0];
            if (item.video_versions && item.video_versions.length > 0) {
                return [{ url: item.video_versions[0].url, isVideo: true }];
            }
            if (item.image_versions2?.candidates?.[0]?.url) {
                return [{ url: item.image_versions2.candidates[0].url, isVideo: false }];
            }
        }
    } catch (e) {
        console.log('[AHMAD RDX] Self-API Method B failed:', e.message);
    }

    // Method C: Embed Page Direct Extraction Engine
    try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        const res = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 15000,
            validateStatus: () => true
        });

        if (res.status === 200 && typeof res.data === 'string') {
            const html = res.data;
            const videoMatch = html.match(/class="EmbeddedMediaVideo"\s+src="([^"]+)"/i) ||
                               html.match(/<video[^>]+src="([^"]+)"/i);
            if (videoMatch && videoMatch[1]) {
                const cleanUrl = videoMatch[1].replace(/&amp;/g, '&');
                return [{ url: cleanUrl, isVideo: true }];
            }

            const imgMatch = html.match(/class="EmbeddedMediaImage"\s+src="([^"]+)"/i);
            if (imgMatch && imgMatch[1]) {
                const cleanUrl = imgMatch[1].replace(/&amp;/g, '&');
                return [{ url: cleanUrl, isVideo: false }];
            }
        }
    } catch (e) {
        console.log('[AHMAD RDX] Self-API Method C failed:', e.message);
    }

    return null;
}

// 3. Buffer File Downloader
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
        credits: 'SARDAR RDX', // Anti-tamper validator protection
        name: 'igautodl',
        eventType: 'message',
        description: 'Instagram Self-API Auto Downloader by AHMAD RDX'
    },
    async run({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;
        if (!body.includes('instagram.com')) return;

        const igData = parseIgUrl(body);
        if (!igData) return;

        console.log('[AHMAD RDX] Processing Shortcode via Self-API:', igData.shortcode);

        let sentMessageID = null;
        try {
            const initialMsg = await api.sendMessage('📥 Instagram media fetch ho rahi hai (Self-API)...\n\n⏳▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  0%', threadID, messageID);
            sentMessageID = initialMsg?.messageID;
        } catch (e) {}

        try {
            // Run Self-Built API Engine
            let mediaList = await selfBuiltIgApi(igData.shortcode, igData.fullUrl);

            if (!mediaList || mediaList.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Media fetch nahi ho saka. Link private ho sakta hai.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            await fs.ensureDir(cacheDir);
            const attachments = [];

            for (let i = 0; i < mediaList.length; i++) {
                const item = mediaList[i];
                if (!item?.url) continue;
                const ext = item.isVideo ? 'mp4' : 'jpg';
                const filePath = path.join(cacheDir, `ig_${Date.now()}_${i}.${ext}`);

                const fileSize = await downloadFile(item.url, filePath);
                if (fileSize > 0) {
                    attachments.push(filePath);
                }
            }

            if (attachments.length === 0) {
                if (sentMessageID) api.unsendMessage(sentMessageID);
                await api.sendMessage('❌ Video file save nahi ho saki.', threadID, messageID);
                api.setMessageReaction('❌', messageID, () => {}, true);
                return;
            }

            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            api.setMessageReaction('✅', messageID, () => {}, true);

            const responseBody = `📥 𝕴𝖓𝖘𝖙𝖆𝖌𝖗𝖆𝖒 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝖗 (AHMAD RDX Self-API)\n\n` +
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
            console.log('[AHMAD RDX] Self-API Main Error:', err.message);
            if (sentMessageID) {
                try { api.unsendMessage(sentMessageID); } catch (e) {}
            }
            await api.sendMessage('❌ Error: ' + err.message, threadID, messageID);
            api.setMessageReaction('❌', messageID, () => {}, true);
        }
    }
};
