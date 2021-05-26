import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Ban a user from chatting!`,
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const userToBan = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });
    const userToBanExists = await User.findOne({ username: userToBan });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.socket.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToBanExists) return chatter.socket.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToBan) return chatter.socket.emit(`commandMessage`, `You cannot ban yourself!`);
    else if (streamer.channel.bans.includes(userToBan)) return chatter.socket.emit(`commandMessage`, `That user is already barred from your channel's chat!`);

    streamer.channel.bans.push(userToBan);

    if (streamer.channel.timeouts.includes(userToBan)) streamer.channel.timeouts.splice(streamer.channel.timeouts.indexOf(userToBan), 1);
    if (streamer.channel.moderators.includes(userToBan)) streamer.channel.moderators.splice(streamer.channel.moderators.indexOf(userToBan), 1);

    streamer.save(() => chatter.socket.emit(`commandMessage`, `${userToBan} has been banned.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.socket.emit(`commandMessage`, `${userToBan} was banned by a moderator.`);
};

export {
    config,
    run
};
