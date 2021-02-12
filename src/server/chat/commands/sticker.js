const User = require(`../../models/user.model.js`);
const Sticker = require(`../../models/sticker.model.js`);

module.exports = {
    description: `Send a sticker that you have access to!`,
    aliases: [`s`],
    usage: `<stickername>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const sticker = args.shift().toLowerCase();

    const stickerToSend = await Sticker.findOne({ stickerName: sticker });
    const stickerOwner = await User.findOne({ username: chatter.username });
    const channel = await User.findOne({ username: chatter.channel });

    if (!stickerToSend) return chatter.emit(`commandMessage`, `That sticker does not exist!`);
    else if ((!stickerOwner && stickerToSend.ownerUsername !== chatter.channel) && stickerToSend.ownerUsername !== `throwdown`) return chatter.emit(`commandMessage`, `You must follow ${stickerToSend.ownerUsername} to use this sticker in this channel!`);
    else if (stickerToSend.channelsBannedOn.includes(chatter.channel)) return chatter.emit(`commandMessage`, `Usage of the sticker "${sticker}" has been banned on this channel.`);
    else if ((stickerToSend.ownerUsername !== channel) && (!channel.settings.useGlobalStickers)) return chatter.emit(`commandMessage`, `Sending stickers from other channels has been disabled.`);

    // Message all users in the channel.
    const users = chatUsers.filter(user => user.channel === chatter.channel);
    for (const user of users) {
        user.emit(`chatMessage`, {
            username: chatter.username,
            displayName: chatter.displayName,
            message: `<img src="${stickerToSend.path}" title="/sticker ${sticker}" height="80"></img>`,
            badges: chatter.perms
        });
    }
};
