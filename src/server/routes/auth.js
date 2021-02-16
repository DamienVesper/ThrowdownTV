require(`dotenv`).config();

// Log utility and config.
const log = require(`../utils/log.js`);
const config = require(`../../../config/config.js`);

const express = require(`express`);
const router = express.Router();
const xssFilters = require(`xss-filters`);
const { randomString } = require(`../utils/random.js`);

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);
const bcrypt = require(`bcryptjs`);
const crypto = require(`crypto`);

// Captcha
const { verify } = require(`hcaptcha`);

// Nodemailer.
const nodemailer = require(`nodemailer`);
const transport = nodemailer.createTransport({
    host: `localhost`,
    port: 25,
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        password: process.env.SMTP_TOKEN
    },
    tls: {
        rejectUnauthorized: false
    }
});

router.post(`/signup`, async (req, res, next) => {
    if (config.mode === `prod`) {
        if (req.body[`h-captcha-response`] === undefined) return res.json({ errors: `Please solve the captcha.` });
    }
    if (!req.body[`signup-username`] || !req.body[`signup-email`] || !req.body[`signup-password`] || !req.body[`signup-password-confirm`] ||
        typeof req.body[`signup-username`] !== `string` || typeof req.body[`signup-email`] !== `string` || typeof req.body[`signup-password`] !== `string` || typeof req.body[`signup-password-confirm`] !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/[a-zA-Z]/.test(req.body[`signup-username`])) return res.json({
        errors: `Your username must contain at least one letter`
    });

    if (req.body[`signup-username`].length < 3 || req.body[`signup-username`].length > 20) return res.json({
        errors: `Your username must be between 3 and 20 characters`
    });

    if (req.body[`signup-username`] !== xssFilters.inHTMLData(req.body[`signup-username`]) || /[^\w\s]/.test(req.body[`signup-username`]) || req.body[`signup-username`].split(` `).length > 1 || config.blacklistedUsernames.includes(req.body[`signup-username`].toLowerCase())) return res.json({
        errors: `Invalid Username`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(req.body[`signup-email`])) return res.json({
        errors: `Invalid email`
    });

    if (req.body[`signup-password`] !== xssFilters.inHTMLData(req.body[`signup-password`])) return res.json({
        errors: `Invalid Password`
    });

    if (req.body[`signup-password`] !== req.body[`signup-password-confirm`]) return res.json({
        errors: `Passwords do not match`
    });

    if (req.body[`signup-password`] < 7 || req.body[`signup-password`] > 48) return res.json({
        errors: `Password must be between 7 and 48 characters`
    });

    if (config.mode === `prod`) {
        try {
            const { success } = await verify(
                process.env.HCAPTCHA_KEY,
                req.body[`h-captcha-response`]
            );
            if (!success) return res.json({ errors: `Invalid Captcha` });
        } catch (e) {
            return res.json({ errors: `Captcha Error. Try again.` });
        }
    }

    const user = await User.findOne({ email: req.body[`signup-email`] });
    if (user) {
        if (!user.verified && ((new Date()) - user.creationDate) > (60 * 60 * 1e3)) user.delete();
        else {
            return res.json({
                errors: `That email is already in use`
            });
        }
    }

    passport.authenticate(`signup`, async (err, user, info) => {
        if (err) return res.json({
            errors: err
        });

        const username = user.username ? user.username : ``;

        if (info) {
            User.findOne({
                username
            }).then(user => {
                if (!user) return log(`red`, err);
                const creationIP = req.header(`x-forwarded-for`) || req.socket.remoteAddress;

                user.email = req.body[`signup-email`];
                user.creationIP = creationIP;
                user.lastIP = user.creationIP;
                user.verified = false;

                user.verifyToken = `n${crypto.randomBytes(32).toString(`hex`)}`;

                const mailOptions = {
                    from: `Throwdown TV <no-reply@throwdown.tv>`,
                    to: user.email,
                    subject: `Verify your Throwdown.TV Account`,
                    text: `Hello ${user.username}, \n\nPlease verify your Throwdown.TV email address via this link: https://${config.domain}/verify/${user.verifyToken}`
                };

                if (config.mode === `dev`) {
                    user.verified = true;
                    user.save(() => {
                        log(`yellow`, `Created account "${user.username}" with email "${user.email}"`);
                        req.logIn(user, err => {
                            if (err) return res.json({
                                errors: err
                            });
                            log(`yellow`, `User "${user.username}" successfully logged in.`);
                            return res.json({
                                success: `Logged in`
                            });
                        });
                    });
                } else {
                    transport.sendMail(mailOptions, err => {
                        if (err) {
                            user.delete();
                            return res.json({
                                errors: `Error sending a verification email to the specified email address.`
                            });
                        }

                        user.save(() => {
                            log(`yellow`, `Created account "${user.username}" with email "${user.email}"`);

                            if (config.mode === `prod`) return res.json({
                                success: `Please verify your email`
                            });

                            else {
                                req.logIn(user, err => {
                                    if (err) return res.json({
                                        errors: err
                                    });
                                    log(`yellow`, `User "${user.username}" successfully logged in.`);
                                });
                            }
                        });
                    });
                }
            });
        }
    })(req, res, next);
});

router.post(`/login`, async (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.json({
            success: `Logged in`
        });
    }
    if (config.mode === `prod`) {
        if (!req.body[`h-captcha-response`]) return res.json({ errors: `Please solve the captcha.` });
    }

    if (!req.body[`login-username`] || !req.body[`login-password`] ||
        typeof req.body[`login-username`] !== `string` || typeof req.body[`login-password`] !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (config.mode === `prod`) {
        try {
            const { success } = await verify(
                process.env.HCAPTCHA_KEY,
                req.body[`h-captcha-response`]
            );
            console.log(success)
            if (success === false) return res.json({ errors: `Invalid Captcha` });
        } catch (e) {
            return res.json({ errors: `Captcha Error. Try again.` });
        }
    }
    res.json({ success: `Logged in, Redirecting...` });
    passport.authenticate(`login`, (err, user, info) => {
        if (err) {
            log(`red`, err);
            return res.json({
                errors: err
            });
        }

        if (!user) return res.json({
            errors: `User does not exist`
        });

        else if (!user.verified) return res.json({
            errors: `Please verify your email`
        });

        req.logIn(user, err => {
            if (err) return res.json({
                errors: err
            });
            log(`yellow`, `User "${user.username}" successfully logged in.`);
            return res.json({
                success: `Logged in`
            });
        });
    })(req, res, next);
});

router.get(`/logout`, (req, res) => {
    if (req.isAuthenticated()) {
        log(`yellow`, `User "${req.user.username}" logged out.`);
        req.logOut();
    }
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({
            isLoggedIn: true,
            username: req.user.username,
            email: req.user.email,
            displayName: req.user.displayName,
            token: req.user.token ? req.user.token : undefined,
            isSuspended: req.user.isSuspended
        });
    } else return res.json({
        isLoggedIn: false
    });
});

router.get(`/changepassword/:token`, async (req, res) => {
    const token = req.params.token;
    const user = await User.findOne({ recoverytoken: token });

    if (!user) {
        res.render(`error.ejs`);
        res.json({ errors: `Invalid/Expired Recovery Token` });
    } else {
        res.render(`changepassword.ejs`);
    }
});

router.post(`/changepassword/:token`, async (req, res) => {
    if (!req.body[`new-password`] || !req.body[`new-password-confirm`] || typeof req.body[`new-password`] !== `string` || typeof req.body[`new-password-confirm`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    if (req.body[`new-password`] !== xssFilters.inHTMLData(req.body[`new-password`])) return res.json({
        errors: `Invalid Password`
    });

    if (req.body[`new-password`] !== req.body[`new-password-confirm`]) return res.json({
        errors: `Passwords do not match`
    });

    if (req.body[`new-password`] < 7 || req.body[`new-password`] > 48) return res.json({
        errors: `Password must be between 7 and 48 characters`
    });

    const token = req.params.token;
    const user = await User.findOne({ recoverytoken: token });
    if (!user) return res.json({ errors: `Invalid/Expired Recovery Token` });

    bcrypt.genSalt(15, (err, salt) => {
        if (err) return res.json({ errors: `An Unknown Error Occoured` });
        bcrypt.hash(req.body[`new-password`], salt, (err, hash) => {
            if (err) return res.json({ errors: `An Unknown Error Occoured` });
            user.recoverytoken = `${randomString(32)}VERIFIED${randomString(32)}`;
            user.password = hash;
            user.save(err => {
                if (err) return res.json({ errors: `An Unknown Error Occoured` });
                if (req.isAuthenticated()) req.logOut();
                res.json({ success: `Succesfully reset password. Redirecting...` });
                log(`blue`, `Successfully Changed Password of ${user.username}.`);
            });
        });
    });
});

router.get(`/recoveraccount`, (req, res) => {
    res.render(`accountrecovery.ejs`);
});

router.post(`/recoveraccount`, async (req, res) => {
    if (!req.body[`recover-email`] || typeof req.body[`recover-email`] !== `string`) return res.json({ errors: `Please fill out the recovery email` });

    const user = await User.findOne({ email: req.body[`recover-email`] });
    if (!user) return res.json({ errors: `Account with this email address does not exist.` });

    user.recoverytoken = `${user.username}verify${randomString(64)}`;
    user.save(() => {
        log(`magenta`, `Saving Recovery Token...`);
        const mailOptions = {
            from: `Throwdown TV <no-reply@throwdown.tv>`,
            to: user.email,
            subject: `Recover your Throwdown.TV Account`,
            text: `Hello ${user.username}, \n\nA request was recieved to recover your account, if this was not you, please ignore this email. \n\nChange your account password with the link here: https://${config.domain}/changepassword/${user.recoverytoken}`
        };
        log(`yellow`, `Attempting to send a Recovery Email to ${user.username} at "${user.email}".`);
        if (config.mode === `dev`) {
            log(`green`, `Verification Email: http://localhost:8080/changepassword/${user.recoverytoken}`);
            res.json({ success: `DEV MODE: Please visit the recover link in logs.` });
        } else {
            transport.sendMail(mailOptions, err => {
                if (err) return res.json({ errors: `Error sending a recovery email to the specified email address.` });
                res.json({ success: `Please check your email for a password recovery link.` });
                log(`blue`, `Sent a Recovery Email to ${user.username} at "${user.email}".`);
            });
        }
    });
});

router.get(`/verify/*`, (req, res) => {
    const token = req.url.split(`/verify/`)[1];
    if (!token) return res.redirect(`/`);

    User.findOne({
        verifyToken: token
    }).then(user => {
        if (!user) return res.redirect(`/`);

        if (user.verified) return res.redirect(`/`);
        else {
            user.verified = true;
            user.verifyToken = undefined;

            user.save(() => {
                log(`yellow`, `User "${user.username}" verified email address "${user.email}".`);
                return res.redirect(`/login`);
            });
        }
    });
});

module.exports = router;
