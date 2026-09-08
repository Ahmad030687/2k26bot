module.exports.config = {
  name: "adduser",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ahmad Boss",
  description: "UID ya FB Link ke zariye member add karein",
  commandCategory: "Group",
  usages: "[UID/Profile Link]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let input = args.join(" ");

  if (!input) return api.sendMessage("⚠️ Ustad, kisi ki UID ya profile link toh do!", threadID, messageID);

  // Profile link se UID nikalne ki koshish (Regex)
  // Ye pattern link mein se ID nikal leta hai
  const uidMatch = input.match(/(?:(?:http|https):\/\/)?(?:www.|m.)?facebook.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-\.]*)/);
  let idToAdd = uidMatch ? uidMatch[1] : input;

  // Agar link username wala hai (e.g. facebook.com/ahmad.boss) toh UID find karni hogi
  // Note: fca-priyansh mein api.getUID aksar username se ID nikal leta hai
  
  api.getUID(idToAdd, (err, uid) => {
    if (err || !uid) {
        // Agar getUID fail ho jaye toh input ko hi UID maan kar try karte hain
        uid = idToAdd; 
    }

    api.addUserToGroup(uid, threadID, (error) => {
      if (error) {
        return api.sendMessage(`❌ Add nahi kar saki!\n\nWajah:\n1. Wo banda meri friend list mein nahi hai.\n2. Group ki privacy settings.\n3. Uski profile privacy.`, threadID, messageID);
      } else {
        return api.sendMessage("✅ Kamyabi se add kar diya gaya hai! 🚀", threadID, messageID);
      }
    });
  });
};