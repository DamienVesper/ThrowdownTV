const express = require(`express`);
const router = express.Router();
const User = require(`../models/user.model.js`);
const Ban = require(`../models/ban.model.js`);

// Landing page.
router.get(`/`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    req.isAuthenticated()
        ? res.redirect(`/browse`)
        : res.render(`welcome.ejs`);
});

// Sign Up / login pages.
router.get(`/signup`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`signup.ejs`);
});
router.get(`/login`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`login.ejs`);
});

// Terms of Service.
router.get(`/tos`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    res.render(`tos.ejs`);
});

// Browsing.
router.get(`/browse`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    res.render(`browse.ejs`);
});

// Staff
router.get(`/staff`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    res.render(`staff.ejs`);
});

// Following.
router.get(`/following`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    res.render(`following.ejs`);
});

// Dashboard.
router.get(`/dashboard`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const user = await User.findOne({ username: req.url.split(`/`)[2].toLowerCase() });
    if (!user) return res.redirect(`/`);

    res.render(`chat.ejs`);
});

router.get(`/vip`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: req.user.username });

    if (!user.perms.vip) return res.render(`subscribeVIP.ejs`);
    else return res.render(`alreadyVIP.ejs`);
});

router.get(`/vip/success`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    console.log(req.query);
    res.send(`Success`);
});

router.get(`/vip/cancel`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    console.log(req.query);
    res.send(`Error`);
});

router.get(`/report/:streamer`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.json({ errors: `Streamer does not exist.` });
    res.render(`report.ejs`);
});

router.get(`/:streamer`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamer = req.params.streamer;

    const user = await User.findOne({ username: streamer.toLowerCase() });
    if (!user) return res.render(`404.ejs`);
    if (user.isSuspended) return res.render(`banned.ejs`);

    res.render(`streamer.ejs`);
});

module.exports = router;
