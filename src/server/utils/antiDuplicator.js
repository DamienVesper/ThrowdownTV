const { randomString } = require(`./random.js`);
const User = require(`../models/user.model.js`);

const log = require(`./log.js`);

module.exports = async () => {
    log(`cyan`, `Checking for duplicate stream keys...`);

    const dbUsers = await User.find({});

    const streamKeys = [];
    for (const user of dbUsers) streamKeys.push(user.settings.streamKey);

    for (const user of dbUsers) {
        const usersWithSameStreamKey = await User.find({ 'settings.streamKey': user.settings.streamKey });

        if (usersWithSameStreamKey.length !== 1) {
            for (const user of usersWithSameStreamKey) {
                log(`blue`, `Duplicate stream key for ${user.username} found. Resetting...`);

                let newStreamKey = `${user.username}${randomString(32)}`;
                while (streamKeys.includes(newStreamKey)) newStreamKey = `${user.username}${randomString(32)}`;
                user.settings.streamKey = newStreamKey;
                user.save();
            }
        }
    }
};
