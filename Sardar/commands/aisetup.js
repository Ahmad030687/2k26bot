const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../config.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return { AI_NAME: 'Mano', AI_OWNER: 'Sardar RDX', AI_MODEL: 'llama-3.1-8b', AI_ENABLED: true }; }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  if (global.config) {
    global.config.AI_NAME    = cfg.AI_NAME;
    global.config.AI_OWNER   = cfg.AI_OWNER;
    global.config.AI_MODEL   = cfg.AI_MODEL;
    global.config.AI_ENABLED = cfg.AI_ENABLED;
    global.config.AI_API_KEY = cfg.AI_API_KEY;
  }
}

function bold(t) {
  const map = { a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',0:'𝟬',1:'𝟭',2:'𝟮',3:'𝟯',4:'𝟰',5:'𝟱',6:'𝟲',7:'𝟳',8:'𝟴',9:'𝟵' };
  return String(t).split('').map(c => map[c] || c).join('');
}

module.exports = {
  config: {
    credits: 'SARDAR RDX',
    name: 'aisetup',
    aliases: ['aiconfig', 'setai'],
    description: 'AI bot ka naam, owner name aur model configure karo.',
    usage: 'aisetup | aisetup name <naam> | aisetup owner <naam> | aisetup model <model> | aisetup on/off',
    category: 'Admin',
    prefix: true,
    adminOnly: true,
    cooldowns: 3
  },

  async run({ event, send, config, isAdmin }) {
    const { senderID, args } = event;
    if (!isAdmin) {
      return send.reply(
        `╭─── « ❌ ACCESS DENIED » ───⟡\n` +
        `│\n` +
        `│ 🚫 Yeh command sirf Admin\n` +
        `│    use kar sakta hai!\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    const cfg = getConfig();
    const sub = (args[0] || '').toLowerCase();

    if (!sub) {
      const status = cfg.AI_ENABLED ? '✅ ON' : '❌ OFF';
      const keyDisplay = cfg.AI_API_KEY ? `${cfg.AI_API_KEY.slice(0, 8)}...` : '❌ Set nahi';
      return send.reply(
        `╭─── « 🤖 AI SETTINGS » ───⟡\n` +
        `│\n` +
        `│ ◈ 𝗔𝗜 𝗡𝗮𝗺𝗲   : ${bold(cfg.AI_NAME || 'Mano')}\n` +
        `│ ◈ 𝗢𝘄𝗻𝗲𝗿     : ${bold(cfg.AI_OWNER || 'Sardar RDX')}\n` +
        `│ ◈ 𝗠𝗼𝗱𝗲𝗹     : ${cfg.AI_MODEL || 'llama-3.1-8b'}\n` +
        `│ ◈ 𝗔𝗣𝗜 𝗞𝗲𝘆   : ${keyDisplay}\n` +
        `│ ◈ 𝗦𝘁𝗮𝘁𝘂𝘀    : ${status}\n` +
        `│\n` +
        `│ 💡 Commands:\n` +
        `│  .aisetup name <naam>\n` +
        `│  .aisetup owner <naam>\n` +
        `│  .aisetup model <model>\n` +
        `│  .aisetup key <api-key>\n` +
        `│  .aisetup on / off\n` +
        `│\n` +
        `│ 🧠 Cerebras Models:\n` +
        `│  • llama-3.1-8b (fast)\n` +
        `│  • llama-3.3-70b (smart)\n` +
        `│  • llama-4-scout-17b-16e\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    if (sub === 'name') {
      const newName = args.slice(1).join(' ').trim();
      if (!newName) return send.reply('❌ Naam likhna bhool gaye!\nExample: .aisetup name Mano');
      cfg.AI_NAME = newName;
      saveConfig(cfg);
      return send.reply(
        `╭─── « ✅ AI NAME » ───⟡\n` +
        `│\n` +
        `│ 🤖 AI ka naam set ho gaya!\n` +
        `│ ◈ ${bold(newName)}\n` +
        `│\n` +
        `│ Ab log "${newName}" bol ke\n` +
        `│ AI se baat kar sakte hain!\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    if (sub === 'owner') {
      const ownerName = args.slice(1).join(' ').trim();
      if (!ownerName) return send.reply('❌ Owner naam likhna bhool gaye!\nExample: .aisetup owner AHMAD RDX');
      cfg.AI_OWNER = ownerName;
      saveConfig(cfg);
      return send.reply(
        `╭─── « ✅ OWNER NAME » ───⟡\n` +
        `│\n` +
        `│ 👑 Owner naam set ho gaya!\n` +
        `│ ◈ ${bold(ownerName)}\n` +
        `│\n` +
        `│ Ab AI apne owner ko\n` +
        `│ "${ownerName}" ke naam se\n` +
        `│ jaanegi!\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    if (sub === 'model') {
      const model = args.slice(1).join(' ').trim();
      if (!model) return send.reply(
        `❌ Model naam likhna bhool gaye!\n\n🧠 Cerebras Models (Recommended):\n• llama-3.1-8b\n• llama-3.3-70b\n• llama-4-scout-17b-16e\n\nExample: .aisetup model llama-3.3-70b`
      );
      cfg.AI_MODEL = model;
      saveConfig(cfg);
      return send.reply(`✅ AI model set: ${bold(model)}`);
    }

    if (sub === 'key' || sub === 'apikey') {
      const key = args[1]?.trim();
      if (!key) return send.reply(`❌ API key likhna bhool gaye!\nExample: .aisetup key csk-xxxxxxxx`);
      cfg.AI_API_KEY = key;
      saveConfig(cfg);
      return send.reply(
        `╭─── « ✅ API KEY SAVED » ───⟡\n` +
        `│\n` +
        `│ 🔑 API Key set ho gayi!\n` +
        `│ ◈ ${key.slice(0, 8)}...\n` +
        `│\n` +
        `│ Ab AI chat kaam karega!\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    if (sub === 'on') {
      cfg.AI_ENABLED = true;
      saveConfig(cfg);
      return send.reply(`✅ AI chat ${bold('ON')} ho gaya!\nAb "${cfg.AI_NAME}" naam se AI baat karega.`);
    }

    if (sub === 'off') {
      cfg.AI_ENABLED = false;
      saveConfig(cfg);
      return send.reply(`❌ AI chat ${bold('OFF')} kar diya.\nAb AI respond nahi karega.`);
    }

    return send.reply(`❓ Unknown option: ${sub}\nType .aisetup for help.`);
  }
};
