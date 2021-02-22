const User = require(`../../models/user.model.js`);

module.exports = {
    description: `Ban a user from chatting!`,
    aliases: [],
    usage: `<on/off>`
};

module.exports.run = async (message, args, chatter, chatUsers) => {
    const value = args.shift().toLowerCase();

    const streamer = await User.findOne({ username: chatter.channel });

    if (!(chatter.perms.moderator || chatter.perms.streamer)) return chatter.emit(`commandMessage`, `You do not have permission to do that!`);
    if (!(value === `on` || value === `off`)) return chatter.emit(`commandMessage`, `Invalid Arguments! Usage: /lockdown <on/off>`);
    if (streamer.settings.lockdown === true && value === `on`) return chatter.emit(`commandMessage`, `Lockdown is already enabled!`);
    if (streamer.settings.lockdown === false && value === `off`) return chatter.emit(`commandMessage`, `Lockdown is already disabled!`);

    if (value === `on`) streamer.settings.lockdown = true;
    else if (value === `off`) streamer.settings.lockdown = false;

    streamer.save(() => chatter.emit(`commandMessage`, `Turned ${value} chat lockdown...`));

    const users = chatUsers.filter(user => user.channel === chatter.channel && user.username !== chatter.username);
    for (const user of users) user.emit(`commandMessage`, `Chat Lockdown was turned ${value} by a moderator.`);
};
