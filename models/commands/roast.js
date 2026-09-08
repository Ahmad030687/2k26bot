const axios = require("axios");

module.exports = {
  config: {
    name: "roast",
    version: "2.5.0",
    hasPermssion: 0,
    credits: "AHMAD RDX",
    description: "AI se ganda aur heavy roast karwayein",
    commandCategory: "AI",
    usages: "[mention/reply/naam]",
    cooldowns: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;

    let targetName = "";
    let targetID = "";

    // 1. Check if Reply
    if (event.type == "message_reply") {
      targetID = messageReply.senderID;
    } 
    // 2. Check if Mention
    else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    try {
      // Naam nikalne ka logic
      if (targetID) {
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } else if (args.length > 0) {
        targetName = args.join(" "); // Agar naam likha ho
      } else {
        return api.sendMessage("⚠️ Kis ko zaleel karna hai? Tag karo ya reply karo! 😂", threadID, messageID);
      }

      api.setMessageReaction("🔥", messageID, () => {}, true);

      // --- HEAVY ROAST SYSTEM PROMPT ---
      const systemPrompt = `Tumhara naam 'Roast King' hai. Tumhara kaam sirf aur sirf logon ko ganda aur zaleel kisam ka roast karna hai. 
      Tum Pakistani/Desi slang use karte ho (e.g. Chawal, Tharki, Namuna, Khassi, Paindu). 
      Tumhara roast itna heavy aur toxic hona chahiye ke parhne wala rone lag jaye. 
      Target ka naam hai: "${targetName}". 
      Is banday ki aisi taisi kardo, iski shakal, iski akal, aur iski auqat par bohot ganda tanz karo. 
      Jawab sirf Urdu/Roman-Urdu mein ho aur 2-3 lines Maximum 3 lines ka ho bas. Bohat gussay wali aur hasne wali emojis use karo. 
      Daryao nahi, full software update kardo iska!`;

      const apiKey = "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"; // Aapki Groq Key
      
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Roast this person: ${targetName}` }
          ],
          max_tokens: 200,
          temperature: 0.9 // High temperature for more creative insults
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const roastReply = res.data.choices[0].message.content;
      
      // Target ko tag kar ke roast bhejna
      return api.sendMessage({
        body: `🔥 **ROASTED BY AHMAD KING** 🔥\n\n${roastReply}`,
        mentions: targetID ? [{ tag: targetName, id: targetID }] : []
      }, threadID, messageID);

    } catch (error) {
      console.log(error);
      return api.sendMessage("Banda itna ganda hai ke AI ne bhi roast karne se mana kar diya! 💀 (API Limit reached)", threadID, messageID);
    }
  }
};