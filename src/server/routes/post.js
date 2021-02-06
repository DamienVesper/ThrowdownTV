const express = require(`express`);
const router = express.Router();
const { randomString } = require(`../utils/random.js`);

const User = require(`../models/user.model.js`);

// All POST requests are handled within this router (except authentication).
router.post(`/dashboard`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`stream-title`] || !req.body[`stream-description`] || !req.body[`donation-link`] ||
    typeof req.body[`stream-title`] !== `string` || typeof req.body[`stream-description`] !== `string` || typeof req.body[`donation-link`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: req.user.username });

    user.settings.title = req.body[`stream-title`].substr(0, 80);
    user.settings.description = req.body[`stream-description`].substr(0, 1000);
    user.settings.donationLink = req.body[`donation-link`].substr(0, 128);

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream data.` });
    });
});

router.post(`/accountoptions`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-name`] || typeof req.body[`display-name`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    if (req.body[`display-name`].toLowerCase() !== req.user.username) return res.json({ errors: `Display Name must match the Username` });

    const user = await User.findOne({ username: req.user.username });

    user.displayName = req.body[`display-name`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account data.` });
    });
});

router.post(`/changestreamkey`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });

    user.settings.streamKey = randomString(32);

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream key.` });
    });
});

// Follow a streamer
router.post(`/follow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const streamer = req.params.streamer;

    const user = await User.findOne({ username: req.user.username });

    if (streamer === req.user.username) return res.json({ errors: `You cannot follow yourself` });

    if (user.followers.contains(streamer)) return res.json({ errors: `You are already following ${streamer}` });

    await user.followers.push(streamer);

    res.redirect(`/${streamer}`);

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully Followed ${streamer}.` });
    });
});

// Unfollow a streamer
router.post(`/unfollow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const streamer = req.params.streamer;

    const user = await User.findOne({ username: req.user.username });

    if (streamer === req.user.username) return res.json({ errors: `You cannot unfollow yourself` });

    if (!user.followers.contains(streamer)) return res.json({ errors: `You do not follow ${streamer}` });

    await user.followers.pull(streamer);

    res.redirect(`/${streamer}`);

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully Unfollowed ${streamer}.` });
    });
});

module.exports = router;
