const User = require(`../models/user.model.js`);

const log = require(`./log.js`);

module.exports = async () => {
    log(`cyan`, `Resetting all RTMP Servers`);

    const dbUsers = await User.find();

    for (const user of dbUsers) {
        user.settings.rtmpServer = `us01`;
        user.settings.notifications = true;
        user.save();
    }
};
