const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
    name: "txt",
    version: "14.0.0",
    hasPermssion: 0,
    credits: "Ahmad RDX",
    description: "100% Exact Voice-to-Text using Groq Whisper-v3",
    commandCategory: "Utility",
    usages: "Voice note ko reply karein .txt se",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;

    // 1. Check if it's a valid audio reply
    if (type !== "message_reply" || !messageReply.attachments[0] || 
       (messageReply.attachments[0].type !== "audio" && messageReply.attachments[0].type !== "video_binary")) {
        return api.sendMessage("❌ Ahmad bhai, kisi voice note ka reply karein!", threadID, messageID);
    }

    // 2. Groq Configuration (Using your provided Key)
    const GROQ_API_KEY = "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";
    const audioUrl = messageReply.attachments[0].url;
    const tempPath = path.join(__dirname, `rdx_groq_${Date.now()}.mp3`);

    api.sendMessage("⚡ [ RDX-AI ] AHMII-v3 Engine processing... 📝", threadID, messageID);

    try {
        // Step 1: Audio file download karna
        const resFile = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(tempPath, Buffer.from(resFile.data));

        // Step 2: FormData tyar karna (Groq API ki requirement)
        const form = new FormData();
        form.append("file", fs.createReadStream(tempPath));
        form.append("model", "whisper-large-v3");
        form.append("temperature", "0"); // 0 matlab 100% exact, no creativity
        form.append("response_format", "json");

        // Note: Language auto-detect hogi, lekin agar sirf Urdu chahiye toh niche wali line un-comment kar dein
        // form.append("language", "ur");

        // Step 3: Groq API ko request bhejna
        const groqRes = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", form, {
            headers: {
                ...form.getHeaders(),
                "Authorization": `Bearer ${GROQ_API_KEY}`
            }
        });

        const transcript = groqRes.data.text;

        if (!transcript || transcript.trim() === "") {
            throw new Error("AI ko kuch sunayi nahi diya. Voice clear nahi hai.");
        }

        const msg = `📜 [ EXACT TRANSCRIPT ]\n━━━━━━━━━━━━━━━━━━━━━\n\n${transcript}\n\n━━━━━━━━━━━━━━━━━━━━━\n⚡ ᴇɴɢɪɴᴇ: AHMAD AI | ʀᴅx`;
        
        return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
        console.error("GROQ ERROR:", error.response?.data || error.message);
        
        let errorDetail = error.message;
        if (error.response?.status === 401) errorDetail = "API Key block ho gayi hai!";
        if (error.response?.status === 413) errorDetail = "Audio file size bohot zyada hai!";

        return api.sendMessage(`❌ AHMAD-AI Fail: ${errorDetail}`, threadID, messageID);
    } finally {
        // Temp file delete karna zaroori hai taake server load na barhay
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
};