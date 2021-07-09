import User from '../models/user.model';

import log from '../utils/log';

const resetStats = async () => {
    const users = await User.find({});
    for (const user of users) {
        user.viewers = [];
        user.live = false;

        user.save();
    }

    log(`cyan`, `Reset the viewer count and livestream status of all users.`);
};

export default resetStats;
