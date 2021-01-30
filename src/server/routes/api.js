const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

router.get(`/streams`, async (req, res) => {
    const streamers = [];
    const streamerData = await User.find({ live: true });

    for (const streamer of streamerData) streamers.push({
        name: streamer.username,
        title: streamer.settings.title,
        description: streamer.settings.description
    });

    return res.json(streamers);
});

router.get(`/stream-data`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamerData = await User.findOne({ username: req.user.username });

    const data = {
        streamTitle: streamerData.settings.title,
        streamDescription: streamerData.settings.description,
        donationLink: streamerData.settings.donationLink,
        streamKey: streamerData.settings.streamKey
    };

    res.jsonp(data);
});

module.exports = router;
