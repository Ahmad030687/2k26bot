module.exports.config = {
  name: "appstate",
  version: "1.0.0",
  hasPermission: 2, // Spelling sahi kar di gayi hai
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "refresh appstate.json",
  commandCategory: "Admin",
  usages: "appstate",
  cooldowns: 5,
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const fs = require("fs-extra");
  
  // Aapki UID yahan set kar di gayi hai
  const permission = ["100016828397863"];
  
  if (!permission.includes(event.senderID)) {
    return api.sendMessage("You don't have permission to use this command", event.threadID, event.messageID);
  }

  let appstate = api.getAppState();
  // JSON object ko string mein badalna
  const data = JSON.stringify(appstate, null, 2); // 'null, 2' se file readable banti hai

  // File ko disk par save karna
  fs.writeFile(`${__dirname}/../../appstate.json`, data, 'utf8', (err) => {
    if (err) {
      return api.sendMessage(`Error writing file: ${err}`, event.threadID);
    } else {
      return api.sendMessage(`Refreshed appstate successfully. Aapka session ab update ho gaya hai.`, event.threadID);
    }
  });
};
