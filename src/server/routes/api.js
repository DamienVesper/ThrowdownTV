const { EmoteLoader } = require(`../emojiloader`);
const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

const currentLoader = new EmoteLoader();
currentLoader.loadEmotes();

router.get(`/assets/img/emotes/:emotename`, async (req, res) => {
    if (currentLoader.emotesArr.includes(req.params.emotename.toLowerCase())) {
        return res.sendFile(currentLoader.emotesDir[`${req.params.emotename}`]);
    }
});

router.get(`/get-emotes`, async (req, res) => {
    return res.send(currentLoader.emotesJson);
});
router.get(`/get-emotes-list`, async (req, res) => {
    return res.send(currentLoader.emotesArr);
});

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
        username: streamerData.username,
        displayName: streamerData.displayName,
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
