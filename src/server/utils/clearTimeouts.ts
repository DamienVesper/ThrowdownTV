import User from '../models/user.model';

import log from './log';

const clearTimeouts = async (callback?: any) => {
    log(`cyan`, `Checking for timed out users...`);

    const dbUsers = await User.find();

    for (const user of dbUsers) {
        if (user.channel.timeouts.length > 0) {
            log(`blue`, `Resetting timed out users for the channel ${user.username}...`);

            user.channel.timeouts = [];
            user.save();
        }
    }

    if (callback !== undefined) callback();
};

export default clearTimeouts;
