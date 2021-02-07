const User = require(`../../models/user.model.js`);
const log = require(`../../utils/log.js`);

module.exports = {
    description: `Promote a chat user to moderator.`,
    aliases: []
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToMod = args.shift();

    const chatUser = await User.findOne({ username: chatter.username });
    if (!chatUser) return log(`red`, `That user does not exist!`);
    else if (!chatter.perms.streamer) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (chatUser.channel.moderators.includes(userToMod)) return chatter.emit(`commandMessage`, `That user is already a moderator of your channel!`);

    chatUser.channel.moderators.push(userToMod);
    chatter.emit(`commandMessage`, `Promoted ${userToMod} to a moderator of your channel.`);
};
