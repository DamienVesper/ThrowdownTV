import User from '../../models/user.model';
import Sticker from '../../models/sticker.model';

import { Chatter, CommandConfig } from '../../types/chat';

const cmd: CommandConfig = {
    desc: `Send a sticker that you have access to!`,
    aliases: [`s`],
    usage: `<stickername>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const sticker = args.shift().toLowerCase();

    const stickerToSend = await Sticker.findOne({ stickerName: sticker });
    const channel = await User.findOne({ username: chatter.channel });

    if (!stickerToSend) return chatter.socket.emit(`commandMessage`, `That sticker does not exist!`);
    else if (stickerToSend.channelsBannedOn.includes(chatter.channel)) return chatter.socket.emit(`commandMessage`, `Usage of the sticker "${sticker}" has been banned on this channel.`);
    else if ((stickerToSend.ownerUsername !== channel.username) && (!channel.settings.useGlobalStickers)) return chatter.socket.emit(`commandMessage`, `Sending stickers from other channels has been disabled.`);

    // Message all users in the channel.
    const users = chatUsers.filter(user => user.channel === chatter.channel);
    for (const user of users) {
        user.socket.emit(`chatMessage`, {
            username: chatter.username,
            displayName: chatter.displayName,
            message: `<img title="/sticker ${sticker}" src="${stickerToSend.path}" height="100"></img>`,
            badges: chatter.perms
        });
    }
};

export {
    cmd,
    run
};
