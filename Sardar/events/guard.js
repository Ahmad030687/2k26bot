module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'guard',
    eventType: 'log:subscribe',
    description: 'Guard system — protects bot integrity.'
  },
  async run({ api, event, config }) {
    const { threadID, logMessageData } = event;
    const addedParticipants = logMessageData?.addedParticipants || [];
    const botID = api.getCurrentUserID();

    const settings = {};
    const botJoined = addedParticipants.some(p => p.userFbId === botID);
    if (!botJoined) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const admins = threadInfo.adminIDs?.map(a => a.uid) || [];

      if (!admins.includes(botID)) {
        await api.sendMessage(
          `⚠️ 𝐀𝐓𝐓𝐄𝐍𝐓𝐈𝐎𝐍!\n\n` +
          `🤖 I am AHMAD RDX BOT.\n` +
          `👑 Please make me admin to use all features!\n\n` +
          `📱 Contact: AHMAD RDX\n` +
          `🔧 Prefix: ${config.PREFIX || '.'}`,
          threadID
        );
      } else {
        await api.sendMessage(
          `✅ 𝐀𝐇𝐌𝐀𝐃 𝐑𝐃𝐗 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃!\n\n` +
          `🌟 ${config.BOTNAME || 'AHMAD RDX BOT'} is ready!\n` +
          `🔧 Prefix: ${config.PREFIX || '.'}\n` +
          `💡 Type ${config.PREFIX || '.'}help for commands`,
          threadID
        );
      }
    } catch {}
  }
};
