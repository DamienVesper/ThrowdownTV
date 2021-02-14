const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Ban a user from chatting!`,
    aliases: [`bans`],
    usage: ``
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const streamer = await User.findOne({ username: chatter.channel });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);

    if (streamer.channel.bans.length === 0) return chatter.emit(`commandMessage`, `Your ban list is empty, congrats!`);
    chatter.emit(`commandMessage`, `Banned Users: ${streamer.channel.bans}`);
};
