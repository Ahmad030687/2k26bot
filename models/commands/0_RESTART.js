module.exports.config = {
  name: "restart",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "mirai",
  description: "Restart the Bot",
  commandCategory: "system",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, args, Users, event }) {
  var mention = Object.keys(event.mentions)[0];
  let name = event.mentions[mention];
  var arraytag = [];
  arraytag.push({ id: mention });
  var a = function (a) { api.sendMessage(a, event.threadID); }
  a("✅𝗔𝗛𝗠𝗔𝗗 𝗥𝗗𝗫 𝘽𝙤𝙩 𝙍𝙚𝙨𝙩𝙖𝙧𝙩𝙞𝙣𝙜 𝙃𝙤 𝙍𝙖𝙝𝙖 𝙃𝙖𝙞..");
  setTimeout(() => { a({ body: "3.." }) }, 5000);
  setTimeout(() => { a({ body: "2.." }) }, 10000);
  setTimeout(() => { a({ body: "1.." }) }, 15000);
  setTimeout(() => { api.sendMessage("⏳𝙏𝙝𝙤𝙧𝙖 𝙒𝙖𝙞𝙩 𝙆𝙖𝙧𝙤 , 𝙍𝙚𝙗𝙤𝙤𝙩𝙞𝙣𝙜..𝙃𝙤 𝙍𝙖𝙝𝙖 𝙃𝙖𝙞", event.threadID, () => process.exit(1)) }, 20000);
};
