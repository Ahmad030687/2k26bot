const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "editcmd",
  version: "1.1.0",
  hasPermssion: 2, // Sirf Bot Admin/Owner
  credits: "Ahmad RDX",
  description: "Command edit karein aur purana msg unsend karein",
  commandCategory: "System",
  usages: ".editcmd [command_name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const commandName = args[0];

  if (!commandName) return api.sendMessage("❌ Command ka naam batayein!", threadID, messageID);

  const filePath = path.join(__dirname, `${commandName}.js`);

  if (!fs.existsSync(filePath)) {
    return api.sendMessage(`❌ '${commandName}' nahi mili.`, threadID, messageID);
  }

  const oldCode = fs.readFileSync(filePath, "utf-8");

  return api.sendMessage(
    `📝 **EDITING:** ${commandName}.js\n\n👇 Naya code reply karein. (Naya code save hote hi ye message delete ho jayega)\n\n\`\`\`javascript\n${oldCode}\n\`\`\``,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID, // Ye ID unsend karne ke kaam aayegi
        author: senderID,
        commandName: commandName,
        filePath: filePath
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, threadID, messageID, senderID } = event;

  if (senderID != handleReply.author) return;

  try {
    // 1. Naya code save karein
    fs.writeFileSync(handleReply.filePath, body, "utf-8");

    // 2. Command ko Reload karein
    delete require.cache[require.resolve(handleReply.filePath)];
    const newCommand = require(handleReply.filePath);
    global.client.commands.delete(handleReply.commandName);
    global.client.commands.set(newCommand.config.name, newCommand);

    // 3. 🔥 PURANA MESSAGE UNSEND KAREIN (Ye raha magic)
    api.unsendMessage(handleReply.messageID);

    return api.sendMessage(
      `✅ **SUCCESS!**\n\nCommand '${handleReply.commandName}' update ho gayi hai.\nPurana code wala message delete kar diya gaya hai.`,
      threadID,
      messageID
    );
  } catch (error) {
    return api.sendMessage(`❌ ERROR: ${error.message}`, threadID, messageID);
  }
};
