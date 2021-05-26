import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Unban a user.`,
    aliases: [],
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const userToUnban = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });
    const userToUnbanExists = await User.findOne({ username: userToUnban });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.socket.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToUnbanExists) return chatter.socket.emit(`commandMessage`, `That user does not exist!`);
    else if (!streamer.channel.bans.includes(userToUnban) && !streamer.channel.timeouts.includes(userToUnban)) return chatter.socket.emit(`commandMessage`, `That user is not barred from your channel's chat!`);
    else if (chatter.username === userToUnban) return chatter.socket.emit(`commandMessage`, `You cannot unban yourself!`);

    if (streamer.channel.timeouts.includes(userToUnban)) streamer.channel.timeouts.splice(streamer.channel.bans.indexOf(userToUnban), 1);
    streamer.channel.bans.splice(streamer.channel.bans.indexOf(userToUnban), 1);
    streamer.save(() => chatter.socket.emit(`commandMessage`, `${userToUnban} has been unbanned.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.socket.emit(`commandMessage`, `${userToUnban} was unbanned by a moderator.`);
};

export {
    config,
    run
};
