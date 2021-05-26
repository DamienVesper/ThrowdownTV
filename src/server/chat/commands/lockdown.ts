import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Disable chatting on your channel!`,
    usage: `<on/off>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const value = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.socket.emit(`commandMessage`, `You do not have permission to do that!`);
    if (!(value === `on` || value === `off`)) return chatter.socket.emit(`commandMessage`, `Invalid Arguments! Usage: /lockdown <on/off>`);

    if (streamer.settings.lockdown === true && value === `on`) return chatter.socket.emit(`commandMessage`, `Lockdown is already enabled!`);
    if (streamer.settings.lockdown === false && value === `off`) return chatter.socket.emit(`commandMessage`, `Lockdown is already disabled!`);

    if (value === `on`) streamer.settings.lockdown = true;
    else if (value === `off`) streamer.settings.lockdown = false;

    streamer.save(() => chatter.socket.emit(`commandMessage`, `Turned ${value} chat lockdown...`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.socket.emit(`commandMessage`, `Chat Lockdown was turned ${value} by a moderator.`);
};

export {
    config,
    run
};
