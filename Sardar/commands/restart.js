module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'restart',
    aliases: ['reboot'],
    description: 'Restart the bot.',
    usage: 'restart',
    category: 'Admin',
    prefix: true,
    adminOnly: true
  },
  async run({ api, event, send , config }) {
    await send.reply('🔄 Restarting AHMAD RDX BOT...\nPlease wait a moment! ⏰');
    setTimeout(() => process.exit(1), 2000);
  }
};
