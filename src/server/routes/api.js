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

module.exports = router;
