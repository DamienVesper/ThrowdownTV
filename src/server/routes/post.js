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
    let globalStickerStatus = true;

    user.settings.title = req.body[`stream-title`].substr(0, 80);
    user.settings.description = req.body[`stream-description`].substr(0, 1000);
    user.settings.donationLink = req.body[`donation-link`].substr(0, 128);

    if (req.body[`allow-global-emotes`]) globalStickerStatus = true;
    else globalStickerStatus = false;

    user.settings.useGlobalStickers = globalStickerStatus;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream data.` });
    });
});

// Update account info
router.post(`/accountoptions/updateinfo`, async (req, res) => {
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

// Update Avatar
router.post(`/accountoptions/updatepfp`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-avatar`] || typeof req.body[`display-avatar`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: req.user.username });
    user.avatarURL = req.body[`display-avatar`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account avatar.` });
    });
});

// Change Stream Key
router.post(`/changestreamkey`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });
    user.settings.streamKey = `${req.user.username}${randomString(32)}`;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream key.` });
    });
});

// Follow a streamer
router.post(`/follow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (!streamer) return res.json({ errors: `That person does not exist!` });
    else if (streamer.username === req.user.username) return res.json({ errors: `You cannot follow yourself` });
    else if (streamer.followers.includes(user.username)) return res.json({ errors: `You are already following ${streamer.username}` });

    streamer.followers.push(user.username);
    streamer.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            return res.json({ success: `Succesfully Followed ${streamer.username}.` });
        }
    });
});

// Unfollow a streamer
router.post(`/unfollow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (streamer.username === req.user.username) return res.json({ errors: `You cannot unfollow yourself` });
    else if (!streamer.followers.includes(user.username)) return res.json({ errors: `You do not follow ${streamer.username}` });

    streamer.followers.splice(user.followers.indexOf(streamer), 1);
    streamer.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            return res.json({ success: `Succesfully Unfollowed ${streamer.username}.` });
        }
    });
});

module.exports = router;