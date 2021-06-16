import bcrypt from 'bcrypt';
import User from '../models/user.model';
import log from './log';
import randomString from './randomString';

const throwdownUser = async (callback?: any) => {
    log(`cyan`, `Resetting all RTMP Servers`);

    const throwdownUser = await User.findOne({ username: `throwdown` });
    if (!throwdownUser) {
        const user = new User({
            username: `throwdown`,
            displayName: `Throwdown`,
            creationDate: new Date(),
            email: `throwdowntvofficial@gmail.com`,
            live: true,
            settings: {
                streamKey: `throwdown_${randomString(32)}`
            },
            password: `throwdown2021`
        });

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return log(`red`, err);
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) return log(`red`, err);

                user.password = hash;
                user.save(err => {
                    if (err) return log(`red`, err);
                    return log(`red`, `Created Default Throwdown User.`);
                });
            });
        });
    } else {
        throwdownUser.email = `throwdowntvofficial@gmail.com`;
        throwdownUser.live = true;
        throwdownUser.settings.streamKey = `throwdown_${randomString(32)}`;
        throwdownUser.settings.title = `Throwdown TV - Free-Speech Livestreaming`;
        throwdownUser.settings.description = `Contact us on Twitter: @ThrowdownLive`;
    }
};

export default throwdownUser;
