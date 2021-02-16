const User = require(`../models/user.model.js`);

const log = require(`./log.js`);

module.exports = async () => {
    log(`cyan`, `Checking for timed out users...`);

    const dbUsers = await User.find();

    for (const user of dbUsers) {
        if (user.channel.timeouts.length > 0) {
            log(`blue`, `Resetting timed out users for the channel ${user.username}...`);

            user.channel.timeouts = [];
            user.save();
        }
    }
};
