import User from '../../models/user.model';
import { Chatter, CommandConfig } from '../../types/chat';

const cmd: CommandConfig = {
    desc: `Promote a chat user to moderator.`,
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const userToMod = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.username });
    const userToModExists = await User.findOne({ username: userToMod });

    if (!chatter.perms.streamer) return chatter.socket.emit(`commandMessage`, `You do not have permission to do that!`);
    else if (!userToModExists) return chatter.socket.emit(`commandMessage`, `That user does not exist!`);
    else if (chatter.username === userToMod) return chatter.socket.emit(`commandMessage`, `You cannot promote yourself to a moderator!`);
    else if (streamer.channel.moderators.includes(userToMod)) return chatter.socket.emit(`commandMessage`, `That user is already a moderator of your channel!`);

    streamer.channel.moderators.push(userToMod);
    streamer.save(() => chatter.socket.emit(`commandMessage`, `Promoted ${userToMod} to a moderator of your channel.`));
};

export {
    cmd,
    run
};
