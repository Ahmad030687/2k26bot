module.exports.config = {
    name: "leave",
    eventType: ["log:unsubscribe"],
    version: "2.1.0",
    credits: "AHMAD RDX",
    description: "1-Liner Leave Notification",
    dependencies: {}
};

module.exports.run = async function({ api, event }) {
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    const { threadID } = event;

    try {
        const leftID = event.logMessageData.leftParticipantFbId;
        const info = await api.getUserInfo(leftID);
        const name = info[leftID].name;

        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "the group";

        let msg = `👋 ${name} has left ${threadName}.`;

        return api.sendMessage(msg, threadID);

    } catch (e) {
        console.log("LeaveNoti Error: ", e);
    }
};
