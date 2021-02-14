const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Promote a chat user to moderator.`,
    aliases: [],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToMod = args.shift().toLowerCase();

    const chatUser = await User.findOne({ username: chatter.username });
    const userToModExists = await User.findOne({ username: userToMod });

    if (!chatter.perms.streamer) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToModExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToMod) return chatter.emit(`commandMessage`, `You cannot promote yourself to a moderator!`);
    else if (chatUser.channel.moderators.includes(userToMod)) return chatter.emit(`commandMessage`, `That user is already a moderator of your channel!`);

    chatUser.channel.moderators.push(userToMod);
    chatUser.save(() => chatter.emit(`commandMessage`, `Promoted ${userToMod} to a moderator of your channel.`));
};