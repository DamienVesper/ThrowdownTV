const User = require(`../../models/user.model.js`);
const Sticker = require(`../../models/sticker.model.js`);

module.exports = {
    description: `Send a sticker that you have access to!`,
    aliases: [`s`],
    usage: `<stickername>`
};

module.exports.run = async (message, args, chatter, chatUsers, streamerUsername) => {
    const sticker = args.shift().toLowerCase();

    /**
    const chatUser = await User.findOne({ username: chatter.username });
    const stickerToSend = await Sticker.findOne({ stickerName: sticker });
    const stickerOwner = await User.findOne({ username: stickerToSend.ownerUsername });

    if (!stickerToSend) return chatter.emit(`commandMessage`, `That sticker does not exist!`);
    else if (!stickerOwner.followers.includes(stickerToSend.ownerUsername) && stickerToSend.ownerUsername !== streamerUsername) return chatter.emit(`commandMessage`, `You must follow ${stickerToSend.ownerUsername} to use this sticker in this channel!`);
    else if (!chatUser.channelsBannedOn.includes(streamerUsername)) return chatter.emit(`commandMessage`, `Usage of the sticker "${sticker}" has been banned on this channel.`);
    */

    // Message all users in the channel.
    const usersToMessage = chatUsers.filter(user => user.channel === streamerUsername);
    for (const user of usersToMessage) {
        user.emit(`chatMessage`, {
            username: chatter.username,
            displayName: chatter.displayName,
            message: `<i src="https://media.discordapp.net/attachments/765053953226309642/765284896447922206/Keemmoment.gif" title="/sticker ${sticker}">`,
            badges: chatter.perms
        });
    }
};
