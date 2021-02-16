const User = require(`../models/user.model.js`);

const log = require(`./log.js`);

module.exports = async () => {
    log(`cyan`, `Resetting all RTMP Servers`);

    const dbUsers = await User.find();

    for (const user of dbUsers) {
        log(`blue`, `Resetting RTMP Server of ${user.username}...`);

        user.settings.rtmpServer = `us01`;
        user.save();
    }
};
