const axios = require("axios");
const { execSync } = require("child_process");
const logger = require("../../utils/log");
const config = require("../../config.json");

module.exports.config = {
  name: "update",
  version: "1.0.5", // Isse hamesha remote version se match ya kam rakhein
  hasPermssion: 2,
  credits: "Shaan Khan", 
  description: "Bot ko Shaan Khan ke GitHub repo se update karein",
  commandCategory: "system",
  usages: "update",
  cooldowns: 10
};

// 🔥 AAPKA GITHUB RAW LINK (LOCKED TO YOUR FORK)
const REMOTE_CONFIG_URL = "https://raw.githubusercontent.com/shaankhank22223/Janu-3.1/main/config.json";

module.exports.run = async function ({ api, event }) {
  try {
    // 🛡️ Credits protection: Isko koi badal nahi payega
    if (this.config.credits !== "Shaan Khan") {
      return api.sendMessage("❌ Error: Author Credits altered. System Lock!", event.threadID);
    }

    // Admin check
    if (!config.ADMINBOT.includes(event.senderID)) {
      return api.sendMessage(
        "❌ Sirf Shaan Khan ya Authorized Admin hi update chala sakta hai.",
        event.threadID
      );
    }

    api.sendMessage("🔍 Janu-3.1 ke naye updates check ho rahe hain...", event.threadID);

    const res = await axios.get(REMOTE_CONFIG_URL, { timeout: 10000 });
    const remoteVersion = res.data.version;
    const localVersion = config.version;

    if (remoteVersion === localVersion) {
      return api.sendMessage(
        `✅ Aapka bot pehle se hi latest version (v${localVersion}) par hai.`,
        event.threadID
      );
    }

    api.sendMessage(
      `🚀 Naya update mil gaya!\n\nOld: v${localVersion}\nNew: v${remoteVersion}\n\n⚙️ Shaan Khan ka system install ho raha hai, please wait...`,
      event.threadID
    );

    // GIT COMMANDS (Aapke fork se code khinchega)
    execSync("git reset --hard HEAD", { stdio: "inherit" }); // Purane changes clear karega
    execSync("git pull origin main", { stdio: "inherit" }); // Naya code layega
    execSync("npm install", { stdio: "inherit" }); // Dependencies update karega

    api.sendMessage(
      "✅ Update successfully installed!\n♻️ Bot restart ho raha hai...",
      event.threadID
    );

    logger(`System updated to v${remoteVersion} by Shaan Khan`, "[ UPDATE ]");

    // Force restart
    setTimeout(() => {
        process.exit(1);
    }, 3000);

  } catch (err) {
    api.sendMessage(
      "❌ Update failed! GitHub connection error ya permission issue.\nError: " + err.message,
      event.threadID
    );
    logger(err.message, "[ UPDATE ERROR ]");
  }
};
