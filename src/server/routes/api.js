const express = require(`express`);
const router = express.Router();

const fs = require(`fs`);
const path = require(`path`);

const User = require(`../models/user.model.js`);
const Ban = require(`../models/ban.model.js`);
const config = require(`../../../config/config.js`);
const Sticker = require(`../models/sticker.model.js`);
const log = require(`../utils/log.js`);

// Nodemailer.
const nodemailer = require(`nodemailer`);
const transport = nodemailer.createTransport({
    host: `localhost`,
    port: 25,
    secure: false,
    auth: {
        user: process.env.NOTIFICATION_SMTP_USERNAME,
        password: process.env.SMTP_TOKEN
    },
    tls: {
        rejectUnauthorized: false
    }
});

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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    return res.json(emotes);
});

router.get(`/rtmp-api/:streamer/:apikey`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamer = req.params.streamer.toLowerCase();
    const apikey = req.params.apikey;
    const streamerData = await User.findOne({ username: streamer });
    if (!streamerData) return res.json({ errors: `Invalid User` });
    if (apikey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });
    const data = {
        username: streamerData.username,
        streamkey: streamerData.settings.streamKey,
        isLive: streamerData.live
    };
    res.json(data);
});

router.post(`/stream-status/:streamkey/:status/:apikey`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamkey = req.params.streamkey.toLowerCase();
    const status = req.params.status.toLowerCase();
    const apikey = req.params.apikey;
    const streamerData = await User.findOne({ "settings.streamKey": streamkey });
    if (!streamerData) return res.json({ errors: `Invalid User` });
    if (apikey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });
    if (status === `true`) streamerData.live = true;
    else if (status === `false`) streamerData.live = false;
    else return res.json({ errors: `Invalid Status, must be either true or false` });
    streamerData.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream status.` });
    });
});

router.post(`/send-notifications`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamer = req.body.streamer;
    const apiKey = req.body.apiKey;
    if (apiKey !== process.env.NOTIFICATION_API_KEY) return res.json({ errors: `Invalid API Key` });
    const streamerData = await User.findOne({ username: streamer });
    if (!streamerData) return res.json({ errors: `Invalid User` });
    for (const follower of streamerData.followers) {
        const followerAccount = await User.findOne({ username: follower });
        if (follower.settings.notifications) {
            const mailOptions = {
                from: `Throwdown TV Notifications <notifications@throwdown.tv>`,
                to: followerAccount.email,
                subject: `${streamerData.displayName} went Live!`,
                text: `${streamerData.displayName} has started broadcasting.\n\nWatch here: https://${config.domain}/${streamerData.username}`
            };
            transport.sendMail(mailOptions, err => {
                if (err) {
                    log(`red`, err);
                }
            });
        }
    }
    res.json({ success: `Sent out notification emails for Streamer: ${streamerData.username}` });
});

router.get(`/get-stickers`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamerData = await User.find({ live: true });
    const streams = [];

    for (const streamer of streamerData) {
        streams.push({
            name: streamer.username,
            displayName: streamer.displayName,
            title: streamer.settings.title,
            description: streamer.settings.description,
            rtmpServer: streamer.settings.rtmpServer,
            isLive: streamer.live
        });
    }

    return res.json(streams);
});

router.post(`/change-streamer-status`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamer = req.body.streamer;
    const apiKey = req.body.apiKey;
    const streamerStatus = req.body.streamerStatus;
    const rtmpServer = req.body.rtmpServer;

    if (apiKey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });
    else if (streamerStatus === undefined || (streamerStatus !== false && streamerStatus !== true)) return res.json({ errors: `Invalid Streamer Status` });

    const user = await User.findOne({ username: streamer });
    user.live = streamerStatus;
    user.rtmpServer = rtmpServer;
    user.save(() => res.json({ success: `Changed Streamer Status` }));
});

router.get(`/following-streams`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamers = [];
    const streamerData = await User.find({ followers: req.user.username });

    for (const streamer of streamerData) streamers.push({
        name: streamer.username,
        displayName: streamer.displayName,
        title: streamer.settings.title,
        description: streamer.settings.description,
        rtmpServer: streamer.settings.rtmpServer,
        isLive: streamer.live
    });

    return res.json(streamers);
});

router.get(`/stream-data`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
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
        allowGlobalEmotes: streamerData.settings.useGlobalStickers,
        notifications: streamerData.settings.notifications
    };

    res.jsonp(data);
});

router.get(`/public-stream-data/:streamer`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
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
        isStaff: streamerData.perms.staff,
        isLive: streamerData.live,
        rtmpServer: streamerData.settings.rtmpServer
    };

    res.jsonp(data);
});

router.get(`/get-followers/:streamer`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) res.render(`404.ejs`);

    const data = {
        followers: streamerData.followers
    };

    res.jsonp(data);
});

module.exports = router;
