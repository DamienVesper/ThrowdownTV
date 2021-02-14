const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Demote a moderator.`,
    aliases: [`demod`],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToUnmod = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.username });
    const userToUnmodExists = await User.findOne({ username: userToUnmod });

    if (!userToUnmodExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (!chatter.perms.streamer) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (chatter.username === userToUnmod) return chatter.emit(`commandMessage`, `You cannot demote yourself from a moderator!`);
    else if (!streamer.channel.moderators.includes(userToUnmod)) return chatter.emit(`commandMessage`, `That user is not a moderator of your channel!`);

    streamer.channel.moderators.splice(streamer.channel.moderators.indexOf(userToUnmod), 1);
    streamer.save(() => chatter.emit(`commandMessage`, `Demoted ${userToUnmod} from a moderator of your channel.`));
};
