module.exports.config = {
        name: "approve",
        version: "1.0.2",
        hasPermssion: 2,
        credits: "MR.SHAAN",
        description: "THIS BOT IS MR. SHAAN",
        commandCategory: "Admin",
    cooldowns: 5
};


const dataPath = __dirname + "/cache/approvedThreads.json";
const dataPending = __dirname + "/cache/pendingdThreads.json";
const fs = require("fs");

module.exports.onLoad = () => {
        if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]));
  if (!fs.existsSync(dataPending)) fs.writeFileSync(dataPending, JSON.stringify([]));
}
module.exports.handleReply = async function ({ event, api, Currencies, handleReply, Users, args }) {
    if (handleReply.author != event.senderID) return;
    const { body, threadID, messageID, senderID } = event;
    const { type } = handleReply;
    let data = JSON.parse(fs.readFileSync(dataPath));
    let dataP = JSON.parse(fs.readFileSync(dataPending));
    let idBox = (args[0]) ? args[0] : threadID;
  switch (type) {
        case "pending": {
          switch (body) {
                case `A`: {
                           data.push(idBox);
                           fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
                           api.sendMessage(`💐𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 𝐁𝐎𝐓 𝐁𝐀𝐁𝐘💐 😇👈
=𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹●============================================================● 💐𝐀𝐏𝐊𝐄 𝐆𝐑𝐎𝐔𝐏 𝐊𝐎 𝐌𝐄𝐑𝐄 𝐁𝐎𝐒𝐒 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 𝐍𝐄 𝐀𝐏𝐏𝐑𝐎𝐕𝐄 𝐊𝐀𝐑 𝐃8𝐘𝐀 𝐇𝐀𝐈𝐈💐 =𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹\n${idBox}`, threadID, () => {
          dataP.splice(dataP.indexOf(idBox), 1);
                    fs.writeFileSync(dataPending, JSON.stringify(dataP, null, 2));
            }, messageID)
        }
        }
      }
    }
  }
module.exports.run = async ({ event, api, args, Threads, handleReply, Users }) => {
        const { threadID, messageID, senderID } = event;
        let data = JSON.parse(fs.readFileSync(dataPath));
  let dataP = JSON.parse(fs.readFileSync(dataPending));
  let msg = "";
  var lydo = args.splice(2).join(" ");
  let idBox = (args[0]) ? args[0] : threadID;
        if (args[0] == "list" || args[0] == "l") {
            msg = `=====「 GC THAT HAD BEEN APPROVED: ${data.length} 」 ====`;
            let count = 0;
            for (e of data) {
        let threadInfo = await api.getThreadInfo(e);
          let threadName = threadInfo.threadName ? threadInfo.threadName : await Users.getNameUser(e);
                    msg += `\n〘${count+=1}〙» ${threadName}\n${e}`;
            }
            api.sendMessage(msg, threadID, (error, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "a",
        })
    }, messageID);
        }
     else if (args[0] == "pending" || args[0] == "p") {
            msg = `=====「 THREADS NEED TO BE APPROVE: ${dataP.length} 」 ====`;
            let count = 0;
            for (e of dataP) {
        let threadInfo = await api.getThreadInfo(e);
          let threadName = threadInfo.threadName ? threadInfo.threadName : await Users.getNameUser(e);
                    msg += `\n〘${count+=1}〙» ${threadName}\n${e}`;
            }
            api.sendMessage(msg, threadID, (error, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "pending",
        })
    }, messageID);
     }
       else if (args[0] == "help" || args[0] == "h") {
         const tst = (await Threads.getData(String(event.threadID))).data || {};
  const pb = (tst.hasOwnProperty("PREFIX")) ? tst.PREFIX : global.config.PREFIX;
  const nmdl = this.config.name
  const cre = this.config.credits
        return api.sendMessage(`=====「 APPROVE 」=====\n\n${pb}${nmdl} l/list => see list of approved boxes\n\n${pb}${nmdl} p/pending => see the list of unapproved boxes\n\n${pb}${nmdl} d/del => with ID to remove from bot used list\n\n${pb}${nmdl} => Attach an ID to browse that box\n\n⇒ ${cre} ⇐`, threadID, messageID);
       }

    else if (args[0] == "del" || args[0] == "d") {
            idBox = (args[1]) ? args[1] : event.threadID;
      if (isNaN(parseInt(idBox))) return api.sendMessage("[ ERR ] Not a number", threadID, messageID);
            if (!data.includes(idBox)) return api.sendMessage("[ ERR ] Box is not pre-approved!", threadID, messageID);
      api.sendMessage(`[ OK ] Your group has been removed from the browsing list by the admin for the reason: ${lydo}`, idBox);
            api.sendMessage(`[ OK ] Box has been removed from the list of allowed bots`, threadID, () => {
                    data.splice(data.indexOf(idBox), 1);
                    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            }, messageID)
    }
    else if (isNaN(parseInt(idBox))) api.sendMessage("[ ERR ] The ID you entered is not valid", threadID, messageID);
    else if (data.includes(idBox)) api.sendMessage(`[ - ] ID ${idBox} pre-approved!`, threadID, messageID);
           else api.sendMessage("💐𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 𝐁𝐎𝐓 𝐁𝐀𝐁𝐘💐 😇●============================================================● 💐𝐀𝐏𝐊𝐄 𝐆𝐑𝐎𝐔𝐏 𝐊𝐎 𝐌𝐄𝐑𝐄 𝐁𝐎𝐒𝐒 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 𝐍𝐄 𝐀𝐏𝐏𝐑𝐎𝐕𝐄 𝐊𝐀𝐑 𝐃8𝐘𝐀 𝐇𝐀𝐈𝐈💐 𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹 \n✧●============================================================●\n●====== 𝐀𝐁𝐁  𝐊𝐀𝐑𝐎  𝐌𝐄𝐒𝐓𝐈 =====●\n●============================================================●\n=𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹\n●============================================================●\n𝐀𝐩𝐏𝐤𝐀 𝐏𝐲𝐑𝐚 𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹 \n●============================================================●\n𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐢𝐝 𝐥𝐢𝐧𝐤 😊👈 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 :- ☞ \n\hhttps://www.facebook.com/profile.php?id=61577631137537\n●============================================================●\n💐𝐊𝐈𝐒𝐈 𝐁𝐇𝐈 𝐓𝐀𝐑𝐀𝐇 𝐊𝐈 𝐇𝐄𝐋𝐏 𝐋𝐄𝐍𝐄 𝐊 𝐋𝐈𝐘𝐄 𝐌𝐄𝐑𝐄 𝐁𝐎𝐒𝐒 𝐒𝐄 𝐁𝐀𝐓 𝐊𝐀𝐑𝐎💐 𝐎𝐰𝐧𝐞𝐫 ➻    🌹 𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 🌹●============================================================● 👉 [💐𝐑𝐄𝐀𝐋𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏💐:🥀 ]", idBox, (error, info) => {
                   api.changeNickname(` 〖 ${global.config.PREFIX} 〗 ➺ ${(!global.config.BOTNAME) ? "" : global.config.BOTNAME}`, idBox, global.data.botID);
      const axios = require('axios');
        const request = require('request');
        const fs = require("fs");
   let admID = "61577631137537";    

      api.getUserInfo(parseInt(admID), (err, data) => {
      if(err){ return console.log(err)}
     var obj = Object.keys(data);
    var firstname = data[obj].name.replace("@", "");  

      axios.get('https://api.satou-chan.xyz/api/endpoint/happy').then(res => {
        let ext = res.data.url.substring(res.data.url.lastIndexOf(".") + 1);
        let callback = function () {
      api.sendMessage({body: `❒❒ 💐𝐁𝐀𝐁𝐘 𝐁𝐎𝐓 𝐀𝐑𝐄 𝐍𝐎𝐖 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃💐 ❒❒\n=====================\n┏━━━━ 🖤 ━━━━┓
  ✦❥⋆⃝𝐀𝐇𝐌𝐀𝐃-𝐑𝐃𝐗 シ︎

┗━━━    🖤 ━━━━┛\n=====================\n➪ BOT: ${global.config.BOTNAME}\n➪ Prefix: ${global.config.PREFIX}\n➪ Users: ${global.data.allUserID.length}\n➪ Groups: ${global.data.allThreadID.length}\n=====================\n[]---------------------------------------[]\nUse '${global.config.PREFIX}Help' T0o View The Commands That Available! 💖\n[]---------------------------------------[]\n⌨ Made by: ${firstname}\n`, mentions: [{
                           tag: firstname,
                           id: admID,
                           fromIndex: 0,
                 }],
                                                attachment: fs.createReadStream(__dirname + `/cache/duyet.${ext}`)
                                        }, idBox,() => fs.unlinkSync(__dirname + `/cache/duyet.${ext}`));
                                };
                                request(res.data.url).pipe(fs.createWriteStream(__dirname + `/cache/duyet.${ext}`)).on("close", callback);
                        }) 
      })
                   if (error) return api.sendMessage("[ ERR ] Something went wrong, make sure the id you entered is valid and the bot is in the box!", threadID, messageID);
                   else {
                           data.push(idBox);
                           fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
                           api.sendMessage(`[ OK ] Successfully Approved The Box (◕‿◕):\n${idBox}`, threadID, () => {
          dataP.splice(dataP.indexOf(idBox), 1);
                    fs.writeFileSync(dataPending, JSON.stringify(dataP, null, 2));
            }, messageID)
        }
           });
  }