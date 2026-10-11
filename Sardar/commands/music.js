/**
 * Project: AHMAD RDX Music Download Command
 * Credits: SARDAR RDX
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');

const cacheDir = path.join(__dirname, '..', 'cache', 'music');

module.exports = {
    'config': {
        'credits': 'SARDAR RDX',
        'name': 'music',
        'aliases': ['play', 'ytmp3', 'song', 'audio'],
        'description': 'YouTube se song download karke audio bhejne ke liye command',
        'usage': '[song name or youtube url]',
        'category': 'media',
        'prefix': true,
        'adminOnly': false,
        'cooldowns': 5
    },
    async 'run'({ api, event, args, send }) {
        const { threadID, messageID } = event;
        const input = args.join(' ');

        if (!input) {
            return send('❌ Kripya kisi song ka naam ya YouTube URL dein!\n📝 Example: .music Vicky B Matata');
        }

        const processingMsg = await api.sendMessage('🔍 Song search aur download ho raha hai...\n⏳ Thoda wait karo...', threadID);
        const msgID = processingMsg?.messageID || processingMsg;

        try {
            let videoUrl = input;
            
            // Agar user ne URL nahi diya toh yt-search se video find karein
            if (!input.includes('youtu.be') && !input.includes('youtube.com')) {
                const searchResults = await yts(input);
                if (!searchResults || searchResults.videos.length === 0) {
                    try { api.unsendMessage(msgID); } catch {}
                    return send('❌ Koi song nahi mila! Sahi naam ya YouTube URL dein.');
                }
                videoUrl = searchResults.videos[0].url;
            }

            const apiUrl = `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data || !response.data.success || !response.data.result || !response.data.result.downloadUrl) {
                try { api.unsendMessage(msgID); } catch {}
                return send('❌ Song download karne mein error aayi hai!');
            }

            const { title, author, duration, thumbnail, downloadUrl } = response.data.result;

            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { 'recursive': true });
            }

            const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);
            const audioDownload = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                maxRedirects: 5
            });

            fs.writeFileSync(filePath, Buffer.from(audioDownload.data));

            try { api.unsendMessage(msgID); } catch {}

            const minutes = Math.floor(duration / 60);
            const seconds = String(duration % 60).padStart(2, '0');

            await api.sendMessage({
                body: `🎵 𝗧𝗶𝘁𝗹𝗲: ${title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${author || 'Unknown'}\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${minutes}:${seconds}\n✨ 𝗖𝗿𝗲𝗱𝗶𝘁𝘀: SARDAR RDX`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch {}
            }, messageID);

        } catch (error) {
            console.error('[music] Error:', error.message);
            try { api.unsendMessage(msgID); } catch {}
            return send('❌ Ek error aa gayi hai: ' + error.message);
        }
    }
};
