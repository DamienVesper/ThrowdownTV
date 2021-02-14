const Sticker = require(`../../models/sticker.model.js`);

module.exports = {
    description: `Unban a sticker from the channel!`,
    aliases: [`us`, `ubs`],
    usage: `<stickername>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const sticker = args.shift().toLowerCase();

    const stickerToBan = await Sticker.findOne({ stickerName: sticker });

    if (!stickerToBan) return chatter.emit(`commandMessage`, `That sticker does not exist!`);
    else if (!stickerToBan.channelsBannedOn.includes(chatter.channel)) return chatter.emit(`commandMessage`, `Usage of the sticker "${sticker}" is not banned on this channel.`);

    stickerToBan.channelsBannedOn.splice(stickerToBan.channelsBannedOn.indexOf(chatter.channel), 1);
    stickerToBan.save(() => chatter.emit(`commandMessage`, `Unbanned usage of Sticker "${sticker}" in this channel.`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.emit(`commandMessage`, `Sticker "${sticker}" was unbanned by a moderator.`);
};
