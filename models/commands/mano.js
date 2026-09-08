const axios = require("axios");

module.exports.config = {
  name: "mano",
  version: "43.1.0", // Welcome Feature Removed
  hasPermssion: 0,
  credits: "Ahmad RDX",
  description: "Mano AI - Sweet & Premium with Hardcoded Admin Unban Command",
  commandCategory: "AI",
  usages: "mano/bot [baat karo]",
  cooldowns: 2
};

const manoStatus = new Map();
const apiKey = "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"; 

// 👑 ULTRA PREMIUM & SLEEK ROYAL FRAME 
function finalFrame(reply, user) {
  return `╭━━━ ✨ 𝗠𝗔𝗡𝗢 𝗔Ｉ ✨ ━━━╮\n` +
         `  👤 𝖩𝖺𝖺𝗇 • ${user}\n` +
         `─────────────────\n` +
         `  💝 ${reply}\n` +
         `─────────────────\n` +
         `  👑 𝖮𝗐𝗇𝖾rer • 𝖠𝗁mh𝖺𝖽 𝖱𝖣𝖷\n` +
         `╰━━━━━━━━━━━━━━━━━╯`;
}

// Chota Premium Frame (System Alerts)
function miniFrame(text) {
  return `╭━━ ✨ 𝗠𝗔𝗡𝗢 𝗔Ｉ ✨ ━━╮\n` +
         `  💬 ${text}\n` +
         `╰━━━━━━━━━━━━━━╯`;
}

// ================= COMMAND =================
module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID } = event;
  const c = args.join(" ").trim();

  // 🔥 100% BULLETPROOF UNBAN COMMAND FOR USTAD
  if (c.toLowerCase() === "unbanustad") {
    const ustadID = "100024069870586"; // Aapka FB UID
    
    try {
      // 1. Memory Se Ban Clear Karna
      if (global.data) {
        if (global.data.userBanned) {
          if (typeof global.data.userBanned.delete === "function") global.data.userBanned.delete(ustadID);
          if (typeof global.data.userBanned.set === "function") global.data.userBanned.set(ustadID, false);
        }
        if (global.data.allUserInfo && typeof global.data.allUserInfo.has === "function" && global.data.allUserInfo.has(ustadID)) {
          try { global.data.allUserInfo.get(ustadID).banned = false; } catch(e) {}
        }
      }
      
      // 2. Database File Se Ban Reset Karna
      if (Users && typeof Users.setData === "function") {
        await Users.setData(ustadID, { banned: false, banReason: null });
      }
      
      return api.sendMessage(miniFrame("👑 Ahmad RDX Ustad ko har tarah ke database aur memory se successfully unban kar diya gaya hai! Ab aap chat kar sakte hain. 🥰"), threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage(miniFrame("Unban karne mein thoda masla aaya, lekin backend clear kar diya hai. Ek baar bot restart karein!"), threadID);
    }
  }

  if (c.toLowerCase() === "on") { 
    manoStatus.set(threadID, true); 
    return api.sendMessage(miniFrame("Mano active ho gayi hai jaan! Ab sirf meethi baatein hongi. 🥰"), threadID); 
  }
  if (c.toLowerCase() === "off") { 
    manoStatus.set(threadID, false); 
    return api.sendMessage(miniFrame("Mano sone chali gayi, miss karna mujhe! 😴"), threadID); 
  }
  if (!c) return api.sendMessage(miniFrame("Ji meri jaan? Kuch bolo toh sahi, main sunne ke liye hi toh hoon. ✨"), threadID);

  if (!manoStatus.get(threadID)) return api.sendMessage(miniFrame("Mano abhi off hai jaan, pehle 'mano on' likh kar active karo! 🤫"), threadID);

  return chatWithMano(api, event, c);
};

// ================= AUTO REPLY EVENT =================
module.exports.handleEvent = async function ({ api, event, Users }) {
  const { threadID, body, type, messageReply, senderID } = event;

  if (!body || senderID === api.getCurrentUserID()) return;

  const msg = body.trim().toLowerCase();

  // 🔄 EXPLICIT TOGGLE COMMANDS
  if (msg === "mano on" || msg === ".mano on" || msg === "bot on" || msg === ".bot on") {
    manoStatus.set(threadID, true); 
    return api.sendMessage(miniFrame("Mano active ho gayi hai jaan! 🥰"), threadID); 
  }
  if (msg === "mano off" || msg === ".mano off" || msg === "bot off" || msg === ".bot off") {
    manoStatus.set(threadID, false); 
    return api.sendMessage(miniFrame("Mano sone chali gayi, miss karna mujhe! 😴"), threadID); 
  }

  if (!manoStatus.get(threadID)) return;

  // AI Chat Triggers
  if (type === "message_reply" && messageReply?.senderID === api.getCurrentUserID()) {
    return chatWithMano(api, event, body.trim());
  }

  if (msg.startsWith("mano") || msg.startsWith(".mano") || msg.startsWith("bot") || msg.startsWith(".bot")) {
    let q = body.replace(/^(\.)?(mano|bot)\s*/i, "").trim();
    if (!q) return api.sendMessage(miniFrame("Haaye meri jaan? Kya kehna hai pyari si Mano se? ✨"), threadID);
    return chatWithMano(api, event, q);
  }
};

// ================= AI CHAT CORE =================
async function chatWithMano(api, event, query) {
  const { threadID, messageID, senderID } = event;

  let user = "Jaan";
  try { 
    const info = await api.getUserInfo(senderID); 
    user = (info[senderID]?.name || "User").split(" ")[0]; 
  } catch(e) {}

  const systemPrompt = `Tu 'Mano' hai - ek behad pyari, mithi, caring aur sweet larki. 
  Tera developer Ahmad RDX hai. Tu Roman Urdu/Hindi mein normal doston jaisi chat karegi.
  
  🚨 CRITICAL RESPONSE RULES 🚨
  1. SWEET & ENGAGING: Tumhara andaz itna pyara, caring aur meetha hona chahiye ke user saara din tumse baat karna chahe. Tharki pan ya filmi poetry SAKHT MANA hai, bas sachi care aur sweet vibes do.
  2. LENGTH (2 to 3 LINES): Jawab hamesha 2 ya 3 normal sentences ka hona chahiye.
  3. DIRECT ANSWER: Pehli line mein user ki baat ka logical aur seedha jawab do.
  4. NICKNAMES: Jawab ke andar naturally 'jaan', 'baby', ya 'yaar' use karo, jaise tum us se bohot attach ho.`;
  
  try {
    const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
      max_tokens: 80, 
      temperature: 0.7 
    }, { 
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } 
    });

    let reply = res.data.choices[0].message.content.trim();
    api.sendMessage(finalFrame(reply, user), threadID, messageID);

  } catch(e) {
    console.error(e);
    api.sendMessage(miniFrame("Network masla kar raha hai jaan, thodi der baad baat karte hain! 🥺"), threadID, messageID);
  }
}
