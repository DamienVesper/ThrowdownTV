const express = require(`express`);
const router = express.Router();
const User = require(`../models/user.model.js`);

// Landing page.
router.get(`/`, (req, res) => {
    console.log(req.headers[`x-forwarded-for`]);
    req.isAuthenticated()
        ? res.redirect(`/browse`)
        : res.render(`welcome.ejs`);
});

// Sign Up / login pages.
router.get(`/signup`, (req, res) => {
    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`signup.ejs`);
});
router.get(`/login`, (req, res) => {
    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`login.ejs`);
});

// Terms of Service.
router.get(`/tos`, (req, res) => res.render(`tos.ejs`));

// Browsing.
router.get(`/browse`, async (req, res) => {
    if (!req.useragent.isMobile) res.render(`browse.ejs`);
    else res.render(`browseMobile.ejs`);
});

// Staff
router.get(`/staff`, async (req, res) => res.render(`staff.ejs`));

// Following.
router.get(`/following`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    if (!req.useragent.isMobile) res.render(`following.ejs`);
    else res.render(`followingMobile.ejs`);
});

// Dashboard.
router.get(`/dashboard`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.redirect(`/logout`);

    res.render(`dashboard.ejs`, {
        user: user.username,
        streamTitle: user.streamTitle,
        streamKey: user.canStream ? user.streamKey : `You do not have permission to stream.`,
        streamDescription: user.streamDescription,
        streamAvatar: user.avatarURL,
        donationLink: user.donationLink,
        discordID: user.discordID
    });
});

// Chat
router.get(`/chat/*`, async (req, res) => {
    const user = await User.findOne({ username: req.url.split(`/`)[2].toLowerCase() });
    if (!user) return res.redirect(`/`);

    res.render(`chat.ejs`);
});

router.get(`/vip`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: req.user.username });

    if (!user.perms.vip) return res.render(`subscribeVIP.ejs`);
    else return res.render(`alreadyVIP.ejs`);
});

router.get(`/vip/success`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    console.log(req.query);
    res.send(`Success`);
});

router.get(`/vip/cancel`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    console.log(req.query);
    res.send(`Error`);
});

router.get(`/report/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.json({ errors: `Streamer does not exist.` });
    res.render(`report.ejs`);
});

router.get(`/:streamer`, async (req, res) => {
    const streamer = req.params.streamer;

    const user = await User.findOne({ username: streamer.toLowerCase() });
    if (!user) return res.render(`404.ejs`);
    if (user.isSuspended) return res.render(`banned.ejs`);

    if (!req.useragent.isMobile) res.render(`streamerDesktop.ejs`);
    else res.render(`streamerMobile.ejs`);
});

module.exports = router;
