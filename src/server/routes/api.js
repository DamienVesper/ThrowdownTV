const express = require(`express`);
const router = express.Router();

const fs = require(`fs`);
const path = require(`path`);

const User = require(`../models/user.model.js`);
const Sticker = require(`../models/sticker.model.js`);
const log = require(`../utils/log.js`);

// Load emotes.
const emotes = [];
fs.readdir(path.resolve(__dirname, `../../client/assets/img/chat/emotes`), (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const emote of files) {
        emotes.push({
            name: emote.split(`.`)[0],
            extension: emote.split(`.`).pop()
        });
    }
});

router.get(`/get-emotes`, async (req, res) => {
    return res.json(emotes);
});

router.get(`/rtmp-api/:streamer/:apikey`, async (req, res) => {
    const streamer = req.params.streamer.toLowerCase();
    const apikey = req.params.apikey;
    const streamerData = await User.findOne({ username: streamer });
    if (!streamerData) return res.json({ errors: `Invalid User` });
    if (apikey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });
    const data = {
        username: streamerData.username,
        streamkey: streamerData.settings.streamKey
    };
    res.json(data);
});

router.get(`/get-stickers`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const stickerData = await Sticker.find({ ownerUsername: req.user.username });
    if (!stickerData) return res.json({ errors: `No stickers for this user` });
    const stickers = [];
    stickerData.forEach(async (sticker) => {
        stickers.push(sticker);
    });
    res.json(stickers);
});

router.get(`/stream-key/:streamKey`, async (req, res) => {
    const streamkey = req.params.streamKey;
    if (!streamkey) res.json({ errors: `Stream key not supplied.` });

    const streamerData = await User.findOne({ "settings.streamKey": streamkey });
    if (!streamerData) res.json({ errors: `Invalid Stream Key` });

    const data = {
        username: streamerData.username,
        verified: streamerData.verified,
        isSuspended: streamerData.isSuspended,
        isVip: streamerData.perms.vip
    };

    res.jsonp(data);
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

router.get(`/following-streams`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamers = [];
    const streamerData = await User.find({ followers: req.user.username });

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
        streamKey: streamerData.settings.streamKey,
        viewers: streamerData.viewers,
        followers: streamerData.followers,
        avatarURL: streamerData.avatarURL,
        isVip: streamerData.perms.vip,
        isStaff: streamerData.perms.staff,
        allowGlobalEmotes: streamerData.settings.useGlobalStickers
    };

    res.jsonp(data);
});

router.get(`/public-stream-data/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) res.render(`404.ejs`);

    const data = {
        username: streamerData.username,
        displayName: streamerData.displayName,
        streamTitle: streamerData.settings.title,
        streamDescription: streamerData.settings.description,
        donationLink: streamerData.settings.donationLink,
        isSuspended: streamerData.isSuspended,
        viewers: streamerData.viewers,
        followers: streamerData.followers,
        avatarURL: streamerData.avatarURL,
        isVip: streamerData.perms.vip,
        isStaff: streamerData.perms.staff
    };

    res.jsonp(data);
});

router.get(`/get-followers/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) res.render(`404.ejs`);

    const data = {
        followers: streamerData.followers
    };

    res.jsonp(data);
});

module.exports = router;
