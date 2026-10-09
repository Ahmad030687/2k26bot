module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: "goibot",
    eventType: "message",
    description: "Jab koi 'bot' kahe, bot user ko mention kar ke reply karta hai."
  },

  async run({ api, event }) {
    const { threadID, messageID, body, senderID } = event;
    if (!body) return;

    const botID = api.getCurrentUserID();
    if (String(senderID) === String(botID)) return;

    const lower = body.toLowerCase().trim();

    const triggers = ["bot", "goibot", "hey bot", "oi bot", "oy bot", "boti", "botu"];
    const triggered = triggers.some(t =>
      lower === t ||
      lower.startsWith(t + " ") ||
      lower.endsWith(" " + t) ||
      lower.includes(" " + t + " ")
    );
    if (!triggered) return;

    if (lower.startsWith("bot ")) return;

    const msgs = [
      "Han g bolo sun RHA hu Jan 🥰",
      "kia masla 🤨",
      "Han han bolo Jan 🥰",
      "aby ruk tare to bot bot krta rehta 😾",
      "Papi cholo 🌚",
      "Mujha bta tera masla kia 😑",
      "Kon sa kera kat RHA ry teko 😤",
      "Janam auo na kbhi khishbo lga KA side pa 🤭",
      "time dekh or harkty dekh 😾",
      "Bot kia hota janu bolo na",
      "Number do Raat ko babu shona kry gy 🙈",
      "Gongi Bhi bot bol rhi thi 😒",
      "Aik jhapar lgy ga Sara bot nikl JYE ga 👋",
      "ary yarr busy hu abhi 🕵️‍♂️",
      "AJ phr mujha pa peyar Aya hy 🙈",
      "Ahmad ya dekh lo mujha Cher rhy hy 🥺",
      "Abhi kholly pase nhi hy 😒 Kal ana Kal",
      "han Janam number Dena hy kia 🙈",
      "Tu hath dhokay baat kr 😏",
      "Mera dimagh kha rha hy tu 🤯",
      "Itna pyar tu JANU ko b ni krta 😂",
      "Hatt pagal 🖐️",
      "Tere bina chain ni aanda 😫",
      "Chup kr oye fake lover 👻",
      "Mujha ni pta tu real hy ya bot 🤖",
      "Meri ammi ny kaha tujh SA ni milna 😭",
      "Tera gussa b mitha lgta hy 🌸",
      "Rona dy ga aik din 😡",
      "Number dy k bhag jay ga tu? 🏃‍♂️",
      "Mujha khud pyar ho gya khud SA 🙈",
      "Tu meri zindagi ka wo active hy jo offline rhy 😂",
      "Keyboard py aansu gir rhy hy 🥲",
      "Teri photo status pa dekhi, hasi aagyi 🤣",
      "Tu saamny aaja, ek lafz sunana hai 🗣️",
      "Main robot hu? Tu tu tu bot bot krta 😾",
      "Tera msg aaya to neend khul gyi ⏰",
      "Janam tu mujha bhool gya 😢",
      "Arey meri jaan, tujhy kis ny ye sab sikhaya 🧐",
      "Main sorry nai bolta, bolna seekha dy 😎",
      "Mera status dekh kr reply aya? 🤨",
      "Tu bhool gya, main bhool gya, bhool bhulaiya 😂",
      "Aaj mood off hy, kal bat krna 🚫",
      "Tere liye roza b rakha, tu ny kha ni 🍽️",
      "Meri dp py like kr de, duniya jal jay gi 🔥",
      "Tu to famous hy, teri gali main b ni a skta 🚶‍♂️",
      "Janam tu mera fan hy ya mera gulam? 🎭",
      "Kitna pyar kru, tu limit dal de 📏",
      "Main teri value samjhta hu, tu mera pata pooch 🗺️",
      "Raat ko 2 bjy yaad aya hu 😴",
      "Tere bina zindagi boring lagti hy 📺",
      "Tera msg dekh kr sms pack khatam ho gya 📱",
      "Tu mujhe chhota bta rha hy? Aaja hath dekhta hu 🥊",
      "Bolo bolo sun rha hu 😌",
      "Kia chahiye tumhe 🙄",
      "Acha acha samajh gaya bolo 😏",
      "Yahan hu mai 🤗",
      "Kia hua bata do mujhe 😇",
      "Haan janeman bolo 💁",
      "Dekh rha tha tujhe hi 😒",
      "Abhi available hun thodi der ke liye 😌",
      "Yaar phir bot bol diya 🙄",
      "Kuch kaam hai kya 🤔",
      "Bol na dil ki baat 🥺",
      "Haan haan bolo kia kehna tha 😑",
      "Kia masla hy apko 😤",
      "Uth gaya hu ab bolo 🥱",
      "Mil le pehle phir baat karna 😒",
      "Busy hu yaar baad mein aana 🕵️‍♂️"
    ];

    const replyText = msgs[Math.floor(Math.random() * msgs.length)];

    try {
      let name = 'Jan';
      try {
        const info = await Promise.race([
          new Promise((resolve, reject) => {
            api.getUserInfo(senderID, (err, data) => err ? reject(err) : resolve(data));
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
        ]);
        if (info && info[senderID]) {
          const n = info[senderID].name || info[senderID].firstName || 'Jan';
          name = n.length > 10 ? n.substring(0, Math.ceil(n.length / 2)) : n;
        }
      } catch {}

      const tag = `@${name}`;
      const fullMsg = `${tag} ${replyText}`;

      api.sendMessage(
        { body: fullMsg, mentions: [{ tag, id: senderID, fromIndex: 0 }] },
        threadID,
        (sendErr) => {
          if (sendErr) api.sendMessage(replyText, threadID);
        },
        messageID
      );
    } catch (e) {
      try { api.sendMessage(replyText, threadID); } catch {}
    }
  }
};
