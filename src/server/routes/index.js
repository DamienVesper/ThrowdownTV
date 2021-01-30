const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

// Landing page.
router.get(`/`, (req, res) => {
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

// 404 Error
router.get(`/404`, (req, res) => res.render(`404.ejs`));

// Browsing.
router.get(`/browse`, async (req, res) => res.render(`browse.ejs`));

// Following.
router.get(`/following`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
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
    if (!req.isAuthenticated()) res.redirect(`/login`);

    const user = await User.findOne({ username: req.url.split(`/`)[2] });
    if (!user) return res.redirect(`/`);

    res.render(`chat.ejs`);
});

router.get(`/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) res.redirect(`/login`);

    const streamer = req.params.streamer;

    const user = await User.findOne({ username: streamer });
    if (!user) return res.redirect(`/404`);

    res.render(`streamer.ejs`);
});

module.exports = router;
