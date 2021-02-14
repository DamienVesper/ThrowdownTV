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
    const channel = await User.findOne({ username: chatter.channel });

    if (!stickerToSend) return chatter.emit(`commandMessage`, `That sticker does not exist!`);
    else if (stickerToSend.channelsBannedOn.includes(chatter.channel)) return chatter.emit(`commandMessage`, `Usage of the sticker "${sticker}" has been banned on this channel.`);
    else if ((stickerToSend.ownerUsername !== channel) && (!channel.settings.useGlobalStickers)) return chatter.emit(`commandMessage`, `Sending stickers from other channels has been disabled.`);

    console.log(stickerToSend.path);

    // Message all users in the channel.
    const users = chatUsers.filter(user => user.channel === chatter.channel);
    for (const user of users) {
        user.emit(`chatMessage`, {
            username: chatter.username,
            displayName: chatter.displayName,
            message: `<img title="/sticker ${sticker}" src="${stickerToSend.path}" height="100"></img>`,
            badges: chatter.perms
        });
    }
};