const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Unban a user!`,
    aliases: [],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToUnban = args.shift().toLowerCase();

    const chatUser = await User.findOne({ username: chatter.username });
    const userToUnbanExists = await User.findOne({ username: userToUnban });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToUnbanExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToUnban) return chatter.emit(`commandMessage`, `You cannot unban yourself!`);
    else if (!chatUser.channel.bans.includes(userToUnban)) return chatter.emit(`commandMessage`, `That user is not banned from your channel!`);

    chatUser.channel.bans.splice(chatUser.channel.bans.indexOf(userToUnban), 1);
    chatUser.save(() => chatter.emit(`commandMessage`, `${userToUnban} has been unbanned.`));
    const users = chatUsers.filter(user => user.channel === chatter.channel);
    for (const user of users) user.emit(`commandMessage`, `${userToUnban} was unbanned by a moderator.`);
};
