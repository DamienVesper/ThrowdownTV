const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Unban a user.`,
    aliases: [],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToUnban = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });
    const userToUnbanExists = await User.findOne({ username: userToUnban });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToUnbanExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (!streamer.channel.bans.includes(userToUnban)) return chatter.emit(`commandMessage`, `That user is not banned from your channel!`);
    else if (chatter.username === userToUnban) return chatter.emit(`commandMessage`, `You cannot unban yourself!`);

    streamer.channel.bans.splice(streamer.channel.bans.indexOf(userToUnban), 1);
    streamer.save(() => chatter.emit(`commandMessage`, `${userToUnban} has been unbanned.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.emit(`commandMessage`, `${userToUnban} was unbanned by a moderator.`);
};
