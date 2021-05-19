const bcrypt = require(`bcryptjs`);
const User = require(`./models/user.model.js`);

const { randomString } = require(`./utils/random.js`);

const passport = require(`passport`);
const LocalStrategy = require(`passport-local`).Strategy;

const log = require(`./utils/log.js`);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// On new database, add the default user.
async function initializeDefaultUser () {
    const defaultUser = await User.findOne({ username: `throwdown` });
    if (!defaultUser) {
        const defaultUser = new User({
            username: `throwdown`,
            displayName: `Throwdown`,
            email: `no-reply@throwdown.tv`,
            verified: true,
            creationDate: new Date(),
            password: `throwdown`,
            settings: {
                title: `ThrowdownTV`,
                description: `Free Speech Livestreaming.`
            }
        });
        defaultUser.save(err => {
            if (err) return log(`red`, err);
            return log(`green`, `Initialized Default User on new Database.`);
        });
    } else {
        log(`green`, `Users already initialized.`);
    }
}
initializeDefaultUser();

// Strategy.
passport.use(`login`, new LocalStrategy({
    usernameField: `login-username`,
    passwordField: `login-password`
}, (username, password, done) => {
    User.findOne({
        username: username.toLowerCase()
    }).then(user => {
        if (!user) return done(`Incorrect username or password`, false);

        // Login a user.
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return log(`red`, err.stack);
            else if (isMatch) {
                const { randomString } = require(`./utils/random.js`);

                user.token = randomString(64);
                user.save();

                return done(null, user);
            } else return done(`Incorrect username / password`, false);
        });
    }).catch(err => {
        return done(err, false);
    });
}));

// Registration.
passport.use(`signup`, new LocalStrategy({
    usernameField: `signup-username`,
    passwordField: `signup-password`
}, (username, password, done) => {
    User.findOne({
        username
    }).then(user => {
        if (user) return done(`User already exists`, false);

        const signupUser = new User({
            username: username.toLowerCase(),
            displayName: username,
            creationDate: new Date(),
            settings: {
                streamKey: `${username.toLowerCase()}${randomString(32)}`
            },
            password
        });

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return done(err);
            bcrypt.hash(signupUser.password, salt, (err, hash) => {
                if (err) return done(err);

                signupUser.password = hash;
                signupUser.save(err => {
                    if (err) return done(err);
                    return done(null, signupUser, `success`);
                });
            });
        });
    });
}));

module.exports = passport;
