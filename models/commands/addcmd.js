const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "addcmd",
  version: "1.0.0",
  hasPermssion: 2, // Sirf Bot Admin/Owner
  credits: "Ahmad RDX",
  description: "Direct bot mein nayi command file add karein",
  commandCategory: "System",
  usages: ".addcmd [command_name]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  let commandName = args[0];

  // 1. Check agar naam nahi dia
  if (!commandName) {
    return api.sendMessage("❌ Command ka naam batayein! (E.g: .addcmd test)", threadID, messageID);
  }

  // 2. .js extension khud hi handle karna
  if (!commandName.endsWith(".js")) {
    commandName += ".js";
  }

  const filePath = path.join(__dirname, commandName);

  // 3. Check agar file pehle se mojood hai
  if (fs.existsSync(filePath)) {
    return api.sendMessage(`⚠️ '${commandName}' pehle se mojood hai. Edit karne ke liye .editcmd use karein.`, threadID, messageID);
  }

  // 4. Purana message unsend (sirf command trigger wala)
  api.unsendMessage(messageID);

  // 5. Code mangne wala message
  return api.sendMessage(
    `🆕 **NEW COMMAND:** ${commandName}\n\n👇 Is message par apna **Code** reply karein taake file save ho sake.`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        commandName: commandName.replace(".js", ""),
        filePath: filePath
      });
    }
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, threadID, messageID, senderID } = event;

  if (senderID != handleReply.author) return;

  try {
    // 6. File save karna
    fs.writeFileSync(handleReply.filePath, body, "utf-8");

    // 7. 🔥 AUTOMATIC LOAD LOGIC
    const newCommand = require(handleReply.filePath);
    
    // Global client mein register karna
    global.client.commands.set(newCommand.config.name, newCommand);

    // 8. Purana instruction wala msg unsend karna
    api.unsendMessage(handleReply.messageID);

    return api.sendMessage(
      `✅ **MISSION SUCCESS!**\n\n📁 File: ${handleReply.commandName}.js\n🚀 Status: Saved & Loaded!\n\nAb aap '.${handleReply.commandName}' use kar sakte hain.`,
      threadID,
      messageID
    );
  } catch (error) {
    // Agar code mein error ho toh file delete kar dena behtar hai taake bot crash na ho
    if (fs.existsSync(handleReply.filePath)) fs.unlinkSync(handleReply.filePath);
    return api.sendMessage(`❌ ERROR IN CODE:\n\n${error.message}\n\nFile save nahi ki gayi kyunke code mein masla tha.`, threadID, messageID);
  }
};
