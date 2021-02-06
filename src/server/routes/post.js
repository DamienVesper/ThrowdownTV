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
router.get(`/follow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (!streamer) return res.json({ errors: `That person does not exist!` });
    else if (streamer.username === req.user.username) return res.json({ errors: `You cannot follow yourself` });
    else if (user.followers.includes(streamer.username)) return res.json({ errors: `You are already following ${streamer.username}` });

    user.followers.push(streamer.username);
    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            res.redirect(`/${streamer.username}`);
            return res.json({ success: `Succesfully Followed ${streamer.username}.` });
        }
    });
});

// Unfollow a streamer
router.get(`/unfollow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (streamer.username === req.user.username) return res.json({ errors: `You cannot unfollow yourself` });
    else if (!user.followers.includes(streamer.username)) return res.json({ errors: `You do not follow ${streamer.username}` });

    user.followers.splice(user.followers.indexOf(streamer), 1);
    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            res.redirect(`/${streamer.username}`);
            return res.json({ success: `Succesfully Unfollowed ${streamer.username}.` });
        }
    });
});

module.exports = router;
