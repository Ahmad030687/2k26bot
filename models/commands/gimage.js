const axios = require("axios");

module.exports.config = {
  name: "gimage",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Search images from Google using RDX API",
  commandCategory: "search",
  usages: "[query]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("⚠️ Please enter a search query.", threadID, messageID);
  }

  try {
    const apiUrl = `http://rdx-api-zone.vercel.app/api/search/gimage?query=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);

    // DEBUG: Agar error aye to terminal check karein ke API kya bhej rahi hai
    // console.log(res.data);

    let imageUrls = [];

    // Check karein ke data array hai ya object ke andar data hai
    if (Array.isArray(res.data)) {
      imageUrls = res.data;
    } else if (res.data && Array.isArray(res.data.data)) {
      imageUrls = res.data.data;
    } else if (res.data && res.data.result) {
      imageUrls = res.data.result;
    }

    if (imageUrls.length === 0) {
      return api.sendMessage("❌ No images found for this query.", threadID, messageID);
    }

    // Random image selection
    const randomImg = imageUrls[Math.floor(Math.random() * imageUrls.length)];

    // Image stream fetch karna
    const stream = await global.utils.getStreamFromURL(randomImg);

    return api.sendMessage({
      body: `🔍 Result for: ${query}`,
      attachment: stream
    }, threadID, messageID);

  } catch (error) {
    console.error("GIMAGE ERROR:", error.response ? error.response.data : error.message);
    return api.sendMessage(`❌ API Error: Connection failed or invalid response.`, threadID, messageID);
  }
};