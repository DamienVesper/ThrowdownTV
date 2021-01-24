const bcrypt = require(`bcryptjs`);
const User = require(`./models/user.model.js`);

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

// Strategy.
passport.use(`login`, new LocalStrategy({
    usernameField: `login-username`,
    passwordField: `login-password`
}, (username, password, done) => {
    User.findOne({
        username
    }).then(user => {
        if (!user) {
            return done(`Incorrect username or password`, false);
        }

        // Login a user.
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return log(`red`, err.stack);

            if (isMatch) {
                const randomNumber = Math.floor(Math.random() * 65536).toString();

                bcrypt.genSalt(5, (err, salt) => {
                    if (err) return done(err);
                    bcrypt.hash(randomNumber, salt, (err, hash) => {
                        if (err) return done(err);

                        user.token = hash;
                        user.save();

                        return done(null, user);
                    });
                });
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
            username,
            creationDate: new Date(),
            password
        });

        bcrypt.genSalt(15, (err, salt) => {
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
