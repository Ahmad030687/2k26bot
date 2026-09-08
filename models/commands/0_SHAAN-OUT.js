module.exports.config = {
    name: "out",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SHAAN BABU",
    description: "THIS BOT WAS MADE BY MR SHAAN",
    commandCategory: "BOT ID OUT OF THE GROUP",
    usages: "PREFIX",
    cooldowns: 10,
};

module.exports.run = async function({ api, event, args }) {
        if (!args[0]) return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
        if (!isNaN(args[0])) return api.removeUserFromGroup(api.getCurrentUserID(), args.join(" "));
}
