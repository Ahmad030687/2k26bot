/**
 * Human-Like Behavior & Anti-Ban Guard
 * Path: Sardar/humanGuard.js
 * Powered by AHMAD RDX
 */

function getRandomDelay(minMs = 1500, maxMs = 3500) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

async function sendHumanMessage(api, messageContent, threadID, originalMsgID = null) {
    return new Promise((resolve, reject) => {
        if (!api || !threadID) return resolve(null);

        api.sendTypingIndicator(threadID, (err) => {
            const textLen = typeof messageContent === 'string' ? messageContent.length : 20;
            const dynamicDelay = Math.min(Math.max(textLen * 40, 1500), 4500) + getRandomDelay(500, 1500);

            setTimeout(() => {
                api.sendMessage(messageContent, threadID, (sendErr, info) => {
                    if (sendErr) {
                        return reject(sendErr);
                    }
                    resolve(info);
                }, originalMsgID);
            }, dynamicDelay);
        });
    });
}

const humanLoginOptions = {
    logLevel: "silent",
    forceLogin: true,
    listenEvents: true,
    selfListen: false,
    autoMarkDelivery: true,
    autoMarkRead: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

module.exports = {
    sendHumanMessage,
    getRandomDelay,
    humanLoginOptions
};
