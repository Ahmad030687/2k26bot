module.exports.config = {
        name: "kalma",
        version: "1.0.1", 
        hasPermssion: 0,
        credits: "Shaan Khan", //don't change the credits please
        description: "the Holy Book.",
        commandCategory: "...",
        cooldowns: 1,
        dependencies: 
        {
    "request":"",
    "fs-extra":"",
    "axios":""
  }
};
module.exports.run = async function({ api,event,args,client,Users,Threads,__GLOBAL,Currencies }) {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
const time = process.uptime(),
                hours = Math.floor(time / (60 * 60)),
                minutes = Math.floor((time % (60 * 60)) / 60),
                seconds = Math.floor(time % 60);
const moment = require("moment-timezone");
var juswa = moment.tz("Asia/Karachi").format("『D/MM/YYYY』 【HH:mm:ss】");
var link = ["https://i.imgur.com/INoal6L.jpeg"];
var callback = () => api.sendMessage({body:`𝗖𝗼𝗱𝗲𝗱 𝗕𝘆:\n≼≽𝐒𝐇𝐀𝐀𝐍≼≽
`,attachment: fs.createReadStream(__dirname + "/cache/juswa.jpg")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/juswa.jpg")); 
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname+"/cache/juswa.jpg")).on("close",() => callback());
   };