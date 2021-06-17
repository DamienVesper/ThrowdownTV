import User from '../models/user.model';

import log from './log';

const resetRTMPServers = async () => {
    log(`cyan`, `Resetting all RTMP Servers`);

    const dbUsers = await User.find({});
    for (const user of dbUsers) {
        user.settings.rtmpServer = `live`;
        user.settings.notifications = true;
        await user.save();
    }
};

export default resetRTMPServers;
