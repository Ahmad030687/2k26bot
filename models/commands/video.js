const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
    name: "video",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Ahmad Ali + ChatGPT",
    description: "Download YouTube Video",
    commandCategory: "media",
    usages: "[video name]",
    cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args.length)
        return api.sendMessage(
            "❌ Please enter a video name.\nExample:\n.video faded",
            threadID,
            messageID
        );

    const query = args.join(" ");

    const loading = await api.sendMessage("🔎 Searching video...", threadID);

    try {

        // Search YouTube
        const search = await yts(query);

        if (!search.videos.length) {
            api.unsendMessage(loading.messageID);
            return api.sendMessage("❌ Video not found.", threadID, messageID);
        }

        const video = search.videos[0];

        api.editMessage("⬇ Downloading video...", loading.messageID);

        // Prince API
        const apiUrl =
            `https://api.princetechn.com/api/download/ytdl?apikey=prince&url=${encodeURIComponent(video.url)}`;

        const res = await axios.get(apiUrl);

        if (
            !res.data.success ||
            !res.data.result ||
            !res.data.result.video_url
        ) {
            throw new Error("Invalid API Response");
        }

        const data = res.data.result;

        const cache = path.join(__dirname, "cache");
        await fs.ensureDir(cache);

        const filePath = path.join(cache, `${Date.now()}.mp4`);

        const response = await axios({
            url: data.video_url,
            method: "GET",
            responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", async () => {

            api.unsendMessage(loading.messageID);

            api.sendMessage(
                {
                    body:
`🎬 ${data.title}

⏱ Duration : ${data.duration}
📺 Quality  : ${data.video_quality}
🎵 Audio    : ${data.audio_quality}

👤 Channel  : ${video.author.name}
👁 Views    : ${video.views.toLocaleString()}

✅ Download Complete.`,
                    attachment: fs.createReadStream(filePath)
                },
                threadID,
                () => fs.unlinkSync(filePath),
                messageID
            );
        });

        writer.on("error", () => {
            api.unsendMessage(loading.messageID);
            api.sendMessage("❌ Failed to save video.", threadID, messageID);
        });

    } catch (err) {
        console.log(err);

        api.unsendMessage(loading.messageID);

        api.sendMessage(
            "❌ Video download failed.\nAPI may be offline.",
            threadID,
            messageID
        );
    }
};