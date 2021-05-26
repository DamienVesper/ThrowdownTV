import Sticker from '../../models/sticker.model';
import Chatter from '../socket';

const config = {
    description: `Ban a sticker from the channel!`,
    aliases: [`bs`],
    usage: `<stickerName>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const sticker = args.shift().toLowerCase();

    const stickerToBan = await Sticker.findOne({ stickerName: sticker });

    if (!stickerToBan) return chatter.socket.emit(`commandMessage`, `That sticker does not exist!`);
    else if (stickerToBan.channelsBannedOn.includes(chatter.channel)) return chatter.socket.emit(`commandMessage`, `Usage of the sticker "${sticker}" is already banned on this channel.`);

    stickerToBan.channelsBannedOn.push(chatter.channel);
    stickerToBan.save(() => chatter.socket.emit(`commandMessage`, `Banned usage of Sticker "${sticker}" in this channel.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.socket.emit(`commandMessage`, `Sticker "${sticker}" was banned by a moderator.`);
};

export {
    config,
    run
};
