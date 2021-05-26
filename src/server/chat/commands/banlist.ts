import User from '../../models/user.model';
import Chatter from '../socket';

const config = {
    description: `Ban a user from chatting!`,
    aliases: [`bans`]
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const streamer = await User.findOne({ username: chatter.channel });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);

    if (streamer.channel.bans.length === 0) return chatter.emit(`commandMessage`, `Your ban list is empty, congrats!`);
    chatter.emit(`commandMessage`, `Banned Users: ${streamer.channel.bans}`);
};

export {
    config,
    run
};
