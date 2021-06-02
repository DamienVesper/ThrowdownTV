import Sticker from '../../models/sticker.model';
import { Chatter, CommandConfig } from '../../types/chat';

const cmd: CommandConfig = {
    desc: `Unban a sticker from the channel!`,
    aliases: [`us`, `ubs`],
    usage: `<stickername>`
};

const run = async (message: string, args: string[], chatter: Chatter, chatUsers: Chatter[]) => {
    const sticker = args.shift().toLowerCase();

    const stickerToBan = await Sticker.findOne({ stickerName: sticker });

    if (!stickerToBan) return chatter.socket.emit(`commandMessage`, `That sticker does not exist!`);
    else if (!stickerToBan.channelsBannedOn.includes(chatter.channel)) return chatter.socket.emit(`commandMessage`, `Usage of the sticker "${sticker}" is not banned on this channel.`);

    stickerToBan.channelsBannedOn.splice(stickerToBan.channelsBannedOn.indexOf(chatter.channel), 1);
    stickerToBan.save(() => chatter.socket.emit(`commandMessage`, `Unbanned usage of Sticker "${sticker}" in this channel.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.socket.emit(`commandMessage`, `Sticker "${sticker}" was unbanned by a moderator.`);
};

export {
    cmd,
    run
};
