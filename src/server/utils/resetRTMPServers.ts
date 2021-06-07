import User from '../models/user.model';

import log from './log';

const resetRTMPServers = async (callback?: any) => {
    log(`cyan`, `Resetting all RTMP Servers`);

    const dbUsers = await User.find({});
    for (const user of dbUsers) {
        user.settings.rtmpServer = `eu01`;
        user.settings.notifications = true;
        user.save();
    }

    if (callback !== undefined) callback();
};

export default resetRTMPServers;
