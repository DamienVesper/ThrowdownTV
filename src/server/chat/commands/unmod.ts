import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Demote a moderator.`,
    aliases: [`demod`],
    usage: `<user>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
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

export {
    config,
    run
};
