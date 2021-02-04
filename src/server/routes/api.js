const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

router.get(`/streams`, async (req, res) => {
    const streamers = [];
    const streamerData = await User.find({ live: true });

    for (const streamer of streamerData) streamers.push({
        name: streamer.username,
        displayName: streamer.displayName,
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

router.get(`/public-stream-data/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    const data = {
        username: streamerData.username,
        displayName: streamerData.displayName,
        streamTitle: streamerData.settings.title,
        streamDescription: streamerData.settings.description,
        donationLink: streamerData.settings.donationLink,
        isSuspended: streamerData.isSuspended
    };

    res.jsonp(data);
});

module.exports = router;
