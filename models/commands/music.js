const axios = require("axios");
const ytSearch = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const ytdl = require("ytdl-core"); // final fallback

module.exports = {
  config: {
    name: "music",
    version: "1.4.0",
    author: "YourName",
    description: "Download and send music from YouTube as an audio file.",
    commandCategory: "media",
    usage: "[song name or YouTube URL]",
    dependencies: {
      "axios": "",
      "yt-search": "",
      "fs-extra": "",
      "ytdl-core": ""
    }
  },

  run: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const query = args.join(" ").trim();

    if (!query) {
      return api.sendMessage(
        "❌ Please provide a song name or a YouTube URL.\nExample: `.music Alan Walker - Faded`",
        threadID,
        messageID
      );
    }

    const processingMsg = await api.sendMessage(
      "⏳ Searching and preparing your song...",
      threadID
    );

    try {
      let videoUrl = query;
      let videoTitle = "";

      // 1. Resolve query to a YouTube URL
      const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(query);
      if (!isUrl) {
        const searchResults = await ytSearch(query);
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
          throw new Error("No results found for your query.");
        }
        const video = searchResults.videos[0];
        videoUrl = video.url;
        videoTitle = video.title;
      }

      // Clean URL
      videoUrl = videoUrl.split("?")[0];

      // 2. Helper: recursively search for any URL in an object
      function findDownloadUrl(obj) {
        if (!obj || typeof obj !== "object") return null;
        // Check if obj itself is a URL string
        if (typeof obj === "string" && obj.startsWith("http") && obj.includes(".mp3")) return obj;
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === "string" && val.startsWith("http") && val.includes(".mp3")) {
            return val;
          }
          if (typeof val === "object") {
            const found = findDownloadUrl(val);
            if (found) return found;
          }
        }
        return null;
      }

      // 3. Try endpoints in order
      const endpoints = [
        { name: "dlmp3", url: `https://api.princetechn.com/api/download/dlmp3?apikey=prince&url=${encodeURIComponent(videoUrl)}` },
        { name: "ytmusic", url: `https://api.princetechn.com/api/download/ytmusic?apikey=prince&quality=mp3&url=${encodeURIComponent(videoUrl)}` },
        { name: "ytmp3", url: `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(videoUrl)}` }
      ];

      let downloadUrl = null;
      let songTitle = videoTitle || "Unknown Title";
      let duration = "0:00";
      let thumbnail = null;
      let lastError = null;

      for (const { name, url } of endpoints) {
        try {
          console.log(`🔍 Trying ${name}...`);
          const response = await axios.get(url, { timeout: 15000 });
          const data = response.data;
          console.log(`📦 Response from ${name}:`, JSON.stringify(data, null, 2));

          if (data.status !== 200 || !data.success) {
            lastError = data.message || `API returned status ${data.status}`;
            continue;
          }

          // Search recursively for a download URL
          const foundUrl = findDownloadUrl(data);
          if (foundUrl) {
            downloadUrl = foundUrl;
            // Extract title, duration, thumbnail from data.result if exists
            const result = data.result || {};
            songTitle = result.title || videoTitle || "Unknown Title";
            duration = result.duration || "0:00";
            thumbnail = result.thumbnail || null;
            break;
          } else {
            lastError = `No download URL found in response from ${name}`;
            // If this is the first endpoint, we can retry once
            if (name === "dlmp3") {
              console.log(`🔄 Retrying dlmp3 once...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              const retryResponse = await axios.get(url, { timeout: 15000 });
              const retryData = retryResponse.data;
              console.log(`📦 Retry response:`, JSON.stringify(retryData, null, 2));
              const retryUrl = findDownloadUrl(retryData);
              if (retryUrl) {
                downloadUrl = retryUrl;
                const result = retryData.result || {};
                songTitle = result.title || videoTitle || "Unknown Title";
                duration = result.duration || "0:00";
                thumbnail = result.thumbnail || null;
                break;
              }
            }
          }
        } catch (err) {
          lastError = `Request failed: ${err.message}`;
          console.error(`❌ ${name} error:`, err.message);
        }
      }

      // 4. If still no URL, use ytdl-core as final fallback
      if (!downloadUrl) {
        console.log("🔄 All APIs failed, trying ytdl-core fallback...");
        try {
          const info = await ytdl.getInfo(videoUrl);
          const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
          if (!audioFormat) throw new Error("No audio format found.");
          downloadUrl = audioFormat.url; // direct stream URL
          songTitle = info.videoDetails.title || videoTitle || "Unknown Title";
          duration = info.videoDetails.lengthSeconds ? `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${String(info.videoDetails.lengthSeconds % 60).padStart(2, "0")}` : "0:00";
          thumbnail = info.videoDetails.thumbnails[0]?.url || null;
        } catch (err) {
          throw new Error(`All methods failed. Last error: ${lastError}. ytdl-core error: ${err.message}`);
        }
      }

      // 5. Download the audio
      let audioStream;
      if (downloadUrl.startsWith("http")) {
        const response = await axios.get(downloadUrl, { responseType: "stream" });
        audioStream = response.data;
      } else {
        // If downloadUrl is not a URL (shouldn't happen), fallback to ytdl stream
        audioStream = ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio" });
      }

      const cacheDir = path.join(__dirname, "..", "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const tempFilePath = path.join(cacheDir, `music_${Date.now()}.mp3`);
      const writer = fs.createWriteStream(tempFilePath);
      audioStream.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 6. Send audio
      const attachment = fs.createReadStream(tempFilePath);
      await api.sendMessage(
        {
          attachment: attachment,
          body: `🎵 ${songTitle} (${duration})`
        },
        threadID,
        (err) => {
          fs.unlink(tempFilePath, () => {});
          if (err) console.error("Send audio error:", err);
        }
      );

      await api.unsendMessage(processingMsg.messageID);

    } catch (error) {
      console.error("Music command error:", error);
      await api.sendMessage(
        `❌ Failed to fetch the song: ${error.message}`,
        threadID,
        messageID
      );
      if (processingMsg) {
        await api.unsendMessage(processingMsg.messageID).catch(() => {});
      }
    }
  }
};