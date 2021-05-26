import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Time out a user from chat for 5 minutes!`,
    aliases: [`t`, `to`],
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const userToTimeout = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });
    const userToTimeoutExists = await User.findOne({ username: userToTimeout });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToTimeoutExists) return chatter.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToTimeout) return chatter.emit(`commandMessage`, `You cannot time yourself out!`);
    else if (streamer.channel.timeouts.includes(userToTimeout)) return chatter.emit(`commandMessage`, `That user is already barred from your channel's chat!`);

    streamer.channel.timeouts.push(userToTimeout);
    if (streamer.channel.moderators.includes(userToTimeout)) streamer.channel.moderators.splice(streamer.channel.moderators.indexOf(userToTimeout), 1);
    streamer.save(() => chatter.emit(`commandMessage`, `${userToTimeout} has been timed out for 5 minutes.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.emit(`commandMessage`, `${userToTimeout} was timed out for 5 minutes by a moderator.`);

    setTimeout(() => {
        if (!streamer.channel.timeouts.includes(userToTimeout)) return;
        streamer.channel.timeouts.splice(streamer.channel.timeouts.indexOf(userToTimeout), 1);
        streamer.save(() => {
            for (const user of users) user.emit(`commandMessage`, `${userToTimeout} was automatically unmuted.`);
            chatter.emit(`commandMessage`, `${userToTimeout} was automatically unmuted.`);
        });
    }, 3e5);
};

export {
    config,
    run
};
