const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

// Landing page.
router.get(`/`, (req, res) => {
    req.isAuthenticated()
        ? res.redirect(`/browse`)
        : res.render(`welcome.ejs`);
});

// Terms of Service.
router.get(`/tos`, (req, res) => res.render(`tos.ejs`));

// Browsing.
router.get(`/browse`, async (req, res) => {
    const streamers = [];
    const streamerData = await User.find({ live: true });

    for (const streamer of streamerData) streamers.push(streamer.username);
    res.render(`browse.ejs`, { streamers });
});

// Following.
router.get(`/following`, async (req, res) => {
    if (!req.isAuthenticated()) res.redirect(`/login`);
});

module.exports = router;
