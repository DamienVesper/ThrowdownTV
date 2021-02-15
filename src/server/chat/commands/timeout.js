const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Time out a user from chat for 5 minutes!`,
    aliases: [`t`, `to`],
    usage: `<user>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const userToTimeout = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });
    const userToTimeoutExists = await User.findOne({ username: userToTimeout });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToTimeoutExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToTimeout) return chatter.emit(`commandMessage`, `You cannot time yourself out!`);
    else if (streamer.channel.bans.includes(userToTimeout)) return chatter.emit(`commandMessage`, `That user is already barred from your channel's chat!`);

    streamer.channel.bans.push(userToTimeout);
    if (streamer.channel.moderators.includes(userToTimeout)) streamer.channel.moderators.splice(streamer.channel.moderators.indexOf(userToTimeout), 1);
    streamer.save(() => chatter.emit(`commandMessage`, `${userToTimeout} has been timed out for 5 minutes.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.emit(`commandMessage`, `${userToTimeout} was timed out for 5 minutes by a moderator.`);

    setTimeout(() => {
        if (!streamer.channel.bans.includes(userToTimeout)) return;
        streamer.channel.bans.splice(streamer.channel.bans.indexOf(userToTimeout), 1);
        streamer.save(() => {
            for (const user of users) user.emit(`commandMessage`, `${userToTimeout} was automatically unmuted.`);
            chatter.emit(`commandMessage`, `${userToTimeout} was automatically unmuted.`);
        });
    }, 300000);
};
