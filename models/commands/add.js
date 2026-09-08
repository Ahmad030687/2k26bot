const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "add",
  version: "6.0.0",
  hasPermssion: 2, 
  credits: "Ahmad Boss",
  description: "Deep Nested Folder & File Creator",
  commandCategory: "System",
  usages: "[folder1/folder2/file.js] [content]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const ownerID = "61577631137537"; // Ahmad Boss UID

  if (senderID != ownerID) return api.sendMessage("⚠️ Ahmad Boss, sirf aap hi system structure badal sakte hain!", threadID, messageID);

  if (args.length < 2) {
    return api.sendMessage("❌ Ahmad bhai, path aur code dono likhein!\n\nExample: .add commands/fun/games/test.js [code]", threadID, messageID);
  }

  try {
    const inputPath = args[0]; 
    const content = args.slice(1).join(" ");
    
    // Pure project ka Root path pakarna (KataBump/Koyeb friendly)
    const fullPath = path.resolve(process.cwd(), inputPath);

    // 📂 RECURSIVE FOLDER CREATION:
    // Ye line check karegi ke poore raste mein jitne bhi folders hain, 
    // agar koi nahi hai toh un sab ko aik sath bana degi.
    const parentDir = path.dirname(fullPath);
    await fs.ensureDir(parentDir);

    // 📄 FILE WRITING:
    await fs.writeFile(fullPath, content, 'utf8');

    return api.sendMessage(`✅ **Deep Add Successful!**\n\n📂 **Path:** ${inputPath}\n📍 **Status:** Folders & File created successfully.\n\n🚀 Ahmad Boss, aapka system update ho gaya!`, threadID, messageID);

  } catch (error) {
    return api.sendMessage(`❌ System Error: ${error.message}`, threadID, messageID);
  }
};