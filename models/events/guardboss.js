module.exports.config = {
  name: "guardBoss",
  eventType: ["log:thread-admins"], 
  version: "1.0.1",
  credits: "Ahmad Boss",
  description: "Ahmad Boss ko admin se hatane wale ko Kick karta hai"
};

module.exports.run = async function({ api, event }) {
  const { logMessageData, author, threadID } = event;
  const ownerID = "61577631137537"; // Ahmad Boss Ki UID
  const botID = api.getCurrentUserID();

  // Agar event admin hatane ka nahi hai toh wapis jao
  if (!logMessageData || logMessageData.ADMIN_EVENT !== "remove_admin") return;

  const removedUserID = logMessageData.TARGET_ID;

  // Agar hatne wala banda Ahmad Boss hai
  if (removedUserID === ownerID) {
    
    // Agar bot ne khud nahi hataya aur Boss ne khud ko nahi hataya
    if (author !== botID && author !== ownerID) {
      
      // 1. Gustakh ko Kick karna
      api.removeUserFromGroup(author, threadID, (err) => {
        if (err) {
          // ERROR: Yahan bot batayega ke masla kya hai
          return api.sendMessage("⚠️ **Ahmad Boss**, aapko kisi ne admin se hataya hai! Lekin main usay kick nahi kar saki kyunke shayad **Main Group Ki Admin Nahi Hoon!** Mujhe admin banayein!", threadID);
        } else {
          
          // 2. Boss ko wapis Admin banana
          api.changeAdminStatus(threadID, ownerID, true, (err2) => {
            if (err2) {
              api.sendMessage("🚨 **GUSTAKHI KI SAZA!** 🚨\nMaine us bande ko group se nikal diya hai, lekin FB ki restriction ki wajah se main aapko wapis admin nahi bana saki.", threadID);
            } else {
              api.sendMessage("🚨 **GUSTAKHI KI SAZA!** 🚨\n\nJis shaks ne mere Malik (Ahmad Boss) ko admin se hatane ki koshish ki, maine usay group se Kick kar diya hai! 🥾\n\n👑 **Ahmad Boss wapis Admin ban gaye hain!**", threadID);
            }
          });
        }
      });
    }
  }
};