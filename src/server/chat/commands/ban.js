const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Ban a user from chatting!`,
    aliases: [],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToBan = args.shift().toLowerCase();

    const chatUser = await User.findOne({ username: chatter.username });
    const userToBanExists = await User.findOne({ username: userToBan });

    if (!userToBanExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (!chatter.perms.streamer || !chatter.perms.moderator) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (chatter.username === userToBan) return chatter.emit(`commandMessage`, `You cannot ban yourself!`);
    else if (chatUser.channel.bans.includes(userToBan)) return chatter.emit(`commandMessage`, `That user is already banned from your channel!`);

    chatUser.channel.bans.push(userToBan);
    chatUser.save(() => chatter.emit(`commandMessage`, `${userToBan} has been banned.`));
    const users = chatUsers.filter(user => user.channel === chatter.channel);
    for (const user of users) user.emit(`broadcastMessage`, `${userToBan} was banned by a moderator.`);
};
