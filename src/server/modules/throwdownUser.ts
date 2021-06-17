import bcrypt from 'bcrypt';
import User from '../models/user.model';
import log from '../utils/log';
import randomString from '../utils/randomString';

const throwdownUser = async () => {
    log(`cyan`, `Checking default Throwdown user.`);

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
        throwdownUser.perms.vip = true;

        throwdownUser.settings.streamKey = `throwdown_${randomString(32)}`;
        throwdownUser.settings.title = `Throwdown TV - Free-Speech Livestreaming`;
        throwdownUser.settings.description = `Contact us on Twitter: @ThrowdownLive`;

        await throwdownUser.save();
    }
};

export default throwdownUser;
