const axios = require('axios');

const HEADERS_DESKTOP = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

const HEADERS_MOBILE = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const FB_HTML_PATTERNS = [
  /"userID":"(\d+)"/,
  /"USER_ID":"(\d+)"/,
  /\\"userID\\":\\"(\d+)\\"/,
  /"identifier"\s*:\s*"(\d{8,})"/,
  /entity_id["\s:]+(\d{8,})/,
  /"owner":{"__typename":"User","id":"(\d+)"/,
  /"profile_id":(\d{8,})/,
  /,"id":"(\d{10,})"/,
  /\["UserID","(\d+)"\]/,
  /"actorID":"(\d{8,})"/,
  /content_owner_id_new%22%3A(\d{8,})/,
  /\/(\d{10,})\/picture/,
  /"pageID":"(\d{8,})"/,
  /"userFbId":"(\d{8,})"/,
];

function extractFromUrl(link) {
  try {
    const u = new URL(link);
    const id = u.searchParams.get('id');
    if (id && /^\d{8,}$/.test(id)) return { uid: id, username: null };
    const seg = u.pathname.split('/').filter(Boolean)[0];
    if (!seg || seg === 'profile.php') return null;
    if (/^\d{8,}$/.test(seg)) return { uid: seg, username: null };
    return { uid: null, username: seg };
  } catch { return null; }
}

function findUIDinHTML(html) {
  for (const pat of FB_HTML_PATTERNS) {
    const m = html.match(pat);
    if (m && /^\d{8,}$/.test(m[1])) return m[1];
  }
  return null;
}

// Method 1: Facebook desktop page
async function tryDesktop(username) {
  try {
    const res = await axios.get(`https://www.facebook.com/${username}`, {
      headers: HEADERS_DESKTOP, timeout: 12000, maxRedirects: 5
    });
    return findUIDinHTML(res.data);
  } catch { return null; }
}

// Method 2: Facebook mobile page (exposes uid differently)
async function tryMobile(username) {
  try {
    const res = await axios.get(`https://m.facebook.com/${username}`, {
      headers: HEADERS_MOBILE, timeout: 12000, maxRedirects: 5
    });
    return findUIDinHTML(res.data);
  } catch { return null; }
}

// Method 3: Facebook Graph API (works for many pages/profiles)
async function tryGraphAPI(username) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${username}?fields=id,name&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { timeout: 10000 }
    );
    if (res.data?.id && /^\d{8,}$/.test(res.data.id)) return res.data.id;
  } catch {}
  return null;
}

// Method 4: findmyfbid third-party service
async function tryFindMyFbId(username) {
  try {
    const res = await axios.get(`https://findmyfbid.in/page/${username}`, {
      headers: HEADERS_DESKTOP, timeout: 12000, maxRedirects: 3
    });
    const m = res.data.match(/(?:fb_id|user.?id|facebook.?id)[^\d]*(\d{8,})/i)
           || res.data.match(/<strong[^>]*>(\d{10,})<\/strong>/)
           || res.data.match(/(\d{10,})/);
    if (m && /^\d{8,}$/.test(m[1])) return m[1];
  } catch {}
  return null;
}

// Method 5: lookup.id service
async function tryLookupId(username) {
  try {
    const res = await axios.post('https://lookup.id/',
      `handle=${encodeURIComponent(username)}`,
      {
        headers: {
          ...HEADERS_DESKTOP,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://lookup.id',
          'Referer': 'https://lookup.id/'
        },
        timeout: 12000, maxRedirects: 3
      }
    );
    const m = res.data.match(/(\d{10,})/);
    if (m && /^\d{8,}$/.test(m[1])) return m[1];
  } catch {}
  return null;
}

// Method 6: Facebook mbasic (super lightweight version)
async function tryMbasic(username) {
  try {
    const res = await axios.get(`https://mbasic.facebook.com/${username}`, {
      headers: HEADERS_MOBILE, timeout: 12000, maxRedirects: 5
    });
    return findUIDinHTML(res.data);
  } catch { return null; }
}

async function resolveUID(username) {
  // Run multiple methods in parallel for speed
  const [graphResult, desktopResult, mobileResult] = await Promise.all([
    tryGraphAPI(username),
    tryDesktop(username),
    tryMobile(username)
  ]);

  if (graphResult) return graphResult;
  if (desktopResult) return desktopResult;
  if (mobileResult) return mobileResult;

  // If parallel methods failed, try sequential fallbacks
  const mbasicResult = await tryMbasic(username);
  if (mbasicResult) return mbasicResult;

  const findResult = await tryFindMyFbId(username);
  if (findResult) return findResult;

  const lookupResult = await tryLookupId(username);
  return lookupResult;
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: "getuid",
    aliases: ["finduid", "profileuid", "fbuid"],
    description: "Kisi bhi Facebook profile ki UID nikalo — public ya private.",
    usage: "getuid <facebook profile link>",
    category: "Utility",
    prefix: true,
    cooldowns: 5
  },

  async run({ api, event, args, send , config }) {
    const { messageID } = event;

    if (!args[0]) {
      return send.reply(
        `╭─── « 🔍 GETUID » ───⟡\n│\n` +
        `│ ❓ Facebook profile link bhejo!\n│\n` +
        `│ 📌 Examples:\n` +
        `│ .getuid fb.com/username\n` +
        `│ .getuid fb.com/profile.php?id=100...\n│\n` +
        `│ ✅ Public aur Private dono!\n│\n` +
        `╰───────────────⟡`
      );
    }

    let link = args[0].trim();

    // Normalize link
    if (!link.startsWith('http')) {
      link = link
        .replace(/^(www\.)?(m\.)?(fb|facebook)\.com\//, '')
        .replace(/^mbasic\.facebook\.com\//, '');
      link = `https://www.facebook.com/${link}`;
    }
    link = link
      .replace('https://fb.com/', 'https://www.facebook.com/')
      .replace('http://fb.com/', 'https://www.facebook.com/')
      .replace('https://m.facebook.com/', 'https://www.facebook.com/')
      .replace('https://mbasic.facebook.com/', 'https://www.facebook.com/')
      .replace('http://m.facebook.com/', 'https://www.facebook.com/')
      .replace('https://facebook.com/', 'https://www.facebook.com/');

    api.setMessageReaction('🔍', messageID, () => {}, true);

    const parsed = extractFromUrl(link);
    if (!parsed) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      return send.reply(`❌ Valid Facebook link nahi hai!\n\nExample: .getuid https://www.facebook.com/username`);
    }

    let uid = parsed.uid;
    const username = parsed.username;

    // If username found, try all methods
    if (!uid && username) {
      uid = await resolveUID(username);
    }

    if (!uid) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      return send.reply(
        `╭─── « ❌ UID NOT FOUND » ───⟡\n│\n` +
        `│ 😕 Is profile ki UID nahi\n│    mili! Profile kuch zyada\n│    locked ho sakti hai.\n│\n` +
        `│ 💡 Try karo:\n` +
        `│ • Profile pe jao → Share karo\n` +
        `│   → Link copy karo (.php?id)\n` +
        `│ • Unhe friend request bhejo\n│\n` +
        `╰───────────────⟡`
      );
    }

    // Try to get name from bot's API
    let name = 'Unknown';
    try {
      const info = await new Promise((resolve) => {
        api.getUserInfo(uid, (err, data) => resolve(err || !data ? null : data[uid]));
      });
      if (info?.name) name = info.name;
    } catch {}

    const profileUrl = username
      ? `https://www.facebook.com/${username}`
      : `https://www.facebook.com/profile.php?id=${uid}`;

    api.setMessageReaction('✅', messageID, () => {}, true);

    return send.reply(
      `╭──── « 🆔 UID FOUND » ────⟡\n│\n` +
      `│ 👤 Name    : ${name}\n│\n` +
      `│ 🔢 UID     : ${uid}\n` +
      (username ? `│ 🔗 Username: @${username}\n` : '') +
      `│\n│ 🌐 Profile :\n│ ${profileUrl}\n│\n` +
      `│ ✅ AHMAD RDX BOT\n` +
      `╰───────────────────────⟡`
    );
  }
};
