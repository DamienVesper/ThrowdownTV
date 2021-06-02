import User from '../../models/user.model';
import { Chatter, CommandConfig } from '../../types/chat';

const cmd: CommandConfig = {
    desc: `Demote a moderator.`,
    aliases: [`demod`],
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const userToUnmod = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.username });
    const userToUnmodExists = await User.findOne({ username: userToUnmod });

    if (!userToUnmodExists) return chatter.socket.emit(`commandMessage`, `That user does not exist!`);
    else if (!chatter.perms.streamer) return chatter.socket.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (chatter.username === userToUnmod) return chatter.socket.emit(`commandMessage`, `You cannot demote yourself from a moderator!`);
    else if (!streamer.channel.moderators.includes(userToUnmod)) return chatter.socket.emit(`commandMessage`, `That user is not a moderator of your channel!`);

    streamer.channel.moderators.splice(streamer.channel.moderators.indexOf(userToUnmod), 1);
    streamer.save(() => chatter.socket.emit(`commandMessage`, `Demoted ${userToUnmod} from a moderator of your channel.`));
};

export {
    cmd,
    run
};
