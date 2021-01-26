// Log utility and request.
const log = require(`../utils/log.js`);

const express = require(`express`);
const router = express.Router();
const xssFilters = require(`xss-filters`);

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/signup`, (req, res, next) => {
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

    if (req.body[`signup-username`] !== xssFilters.inHTMLData(req.body[`signup-username`]) || /[^\w\s]/.test(req.body[`signup-username`])) return res.json({
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

    User.findOne({
        email: req.body[`signup-email`]
    }).then(user => {
        if (user) {
            if (!user.verified && ((new Date()) - user.creationDate) > (60 * 60 * 1e3)) {
                user.delete();
            } else {
                return res.json({
                    errors: `That email is already in use`
                });
            }
        }

        passport.authenticate(`signup`, (err, user, info) => {
            if (err) return res.json({
                errors: err
            });

            const username = user.username ? user.username : ``;

            if (info) {
                User.findOne({
                    username
                }).then(user => {
                    if (!user) return log(`red`, err);
                    const creationIP = req.header(`x-forwarded-for`) || req.connection.remoteAddress;

                    user.email = req.body[`signup-email`];
                    user.creationIP = creationIP;
                    user.lastIP = user.creationIP;

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
                });
            }
        })(req, res, next);
    });
});

router.post(`/login`, (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.json({
            success: `Logged in`
        });
    }

    if (!req.body[`login-username`] || !req.body[`login-password`] ||
        typeof req.body[`login-username`] !== `string` || typeof req.body[`login-password`] !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

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

router.get(`/logout`, (req, res, next) => {
    if (req.isAuthenticated()) {
        log(`yellow`, `User "${req.user.username}" logged out.`);
        req.logOut();
    }
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.json({
            isLoggedIn: true,
            username: req.user.username,
            token: req.user.token ? req.user.token : undefined
        });
    } else return res.json({
        isLoggedIn: false
    });
});

module.exports = router;
