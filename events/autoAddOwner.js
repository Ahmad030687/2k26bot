module.exports.config = {
 name: "autoAddOwner",
 eventType: ["log:subscribe"], // Jab koi bot ya banda add hota hai
 version: "1.0.0",
 credits: "Ahmad Boss",
 description: "Jahan bot add hoga, wahan Ahmad Boss khud hi add ho jayenge!"
};

module.exports.run = async function({ api, event }) {
 const { threadID, logMessageData } = event;
 const ownerID = "61577631137537"; // Ahmad Ali (Ahmad Boss) UID
 const botID = api.getCurrentUserID();

 // Check karna ke kya bot khud add hua hai?
 if (logMessageData.addedParticipants.some(i => i.userID == botID)) {
 
 // 1. Pehle aik pyara sa greeting message bhejein
 api.sendMessage("Shukriya mujhe add karne ka! ✨\nMai apne Malik (Ahmad Boss) ko bula rahi hoon yahan... 🚀", threadID);

 // 2. Malik (Ahmad Boss) ko GC mein add karna
 api.addUserToGroup(ownerID, threadID, (err) => {
 if (err) {
 // Agar add nahi kar pa raha (privacy ki wajah se) toh link bhej de
 return api.sendMessage("⚠️ Ustad, aapki privacy settings ki wajah se main add nahi kar pa rahi. Aap khud join kar lein ya mujhe admin banayein!", threadID);
 } else {
 return api.sendMessage("✅ Ahmad Boss ko kamyabi se add kar diya gaya hai! 👑", threadID);
 }
 });
 }
};