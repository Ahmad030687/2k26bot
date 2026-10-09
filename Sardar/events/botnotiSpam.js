const moment = require('moment-timezone');

const _spamAlerted = new Set();

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'botnotiSpam',
    eventType: 'message_reply',
    description: 'Jab bot ka message spam flag ho, NOTIFY_TID ko alert bhejo.'
  },
  async run({ api, event, config }) {
    const notifyTid = config.NOTIFY_TID;
    if (!notifyTid) return;

    const { threadID, isGroup } = event;
    if (!isGroup) return;

    const key = `${threadID}`;
    if (_spamAlerted.has(key)) return;

    try {
      await new Promise((res, rej) =>
        api.sendMessage('', threadID, (err) => err ? rej(err) : res())
      );
    } catch (err) {
      const msg = (err?.message || err?.errorDescription || '').toLowerCase();
      const isSpam = msg.includes('spam') || msg.includes('blocked') || msg.includes('policy') || err?.error === 1545012;
      if (!isSpam) return;

      _spamAlerted.add(key);
      setTimeout(() => _spamAlerted.delete(key), 3600000);

      let groupName = 'Unknown Group';
      try {
        const info = await new Promise((res, rej) => api.getThreadInfo(threadID, (e, d) => e ? rej(e) : res(d)));
        groupName = info.threadName || 'Unknown Group';
      } catch {}

      const time = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('hh:mm A | DD/MM/YYYY');

      try {
        await api.sendMessage(
          `╭─── « ⚠️ SPAM ALERT » ───⟡\n│\n│ ⚠️ Bot ko is group mein ${bold('SPAM')} mark ho gaya!\n│\n│ ◈ 🏠 Group : ${groupName}\n│ ◈ 🆔 TID   : ${threadID}\n│ ◈ ⏰ Time   : ${time}\n│\n│ 💡 Bot is group mein messages nahi bhej sakta.\n│ 👑 AHMAD RDX BOT\n╰───────────────⟡`,
          notifyTid
        );
      } catch {}
    }
  }
};

function bold(str) {
  const map = { a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭' };
  return [...String(str)].map(c => map[c] || c).join('');
}
