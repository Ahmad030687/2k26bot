const fs = require("fs");

module.exports.config = {
  name: "call2",
  version: "7.3.1",
  hasPermssion: 0,
  credits: "uzairrajput",
  description: "Get Pair From Mention",
  commandCategory: "img",
  usages: "call @mention",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

(function(){
  const authorChars = [117,122,97,105,114,114,97,106,112,117,116];
  const expected = String.fromCharCode(...authorChars);
  try {
    const script = fs.readFileSync(__filename, "utf8");
    const creditMatch = script.match(/credits\s*:\s*["'`]([^"'`]+)["'`]/i);
    const actualCredit = creditMatch ? creditMatch[1].trim().toLowerCase() : null;
    if (actualCredit !== expected) {
      process.exit(1);
    }
  } catch (e) {
    process.exit(1);
  }
})();

module.exports.onLoad = async () => {
  const { resolve } = global.nodemodule["path"];
  const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
  const { downloadFile } = global.utils;
  const dirMaterial = __dirname + `/uzair/mtx/`;
  const path = resolve(__dirname, 'uzair/mtx', 'uzairrcalll.jpg');
  if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
  if (!existsSync(path)) await downloadFile("https://i.ibb.co/Ndb86pQH/uzairrcall.jpg", path);
};

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];
  const __root = path.resolve(__dirname, "uzair", "mtx");

  let batgiam_img = await jimp.read(__root + "/uzairrcalll.jpg");
  let pathImg = __root + `/batman${one}_${two}.jpeg`;
  let avatarOne = __root + `/avt_${one}.jpeg`;
  let avatarTwo = __root + `/avt_${two}.jpeg`;

  let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8'));

  let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8'));

  let circleOne = await jimp.read(await circle(avatarOne));
  let circleTwo = await jimp.read(await circle(avatarTwo));
  batgiam_img
    .composite(circleOne.resize(72, 72), 148, 357)
    .composite(circleTwo.resize(72, 72), 440, 357);

  let raw = await batgiam_img.getBufferAsync("image/jpeg");
  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

async function circle(image) {
  const jimp = require("jimp");
  image = await jimp.read(image);
  image.circle();
  return await image.getBufferAsync("image/png");
}

module.exports.handleEvent = async function ({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID, body } = event;

  if (!body) return;
  if (!body.toLowerCase().startsWith("call2")) return;

  const mention = Object.keys(event.mentions);
  if (!mention[0]) return;

  const one = senderID, two = mention[0];
  return makeImage({ one, two }).then(path =>
    api.sendMessage(
      { body: "OWNER AHMII", attachment: fs.createReadStream(path) },
      threadID,
      () => fs.unlinkSync(path),
      messageID
    )
  );
};

module.exports.run = async function () { 
  return;
};