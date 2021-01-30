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

    user.settings.title = req.body[`stream-title`].substr(0, 32);
    user.settings.description = req.body[`stream-description`].substr(0, 64);
    user.settings.donationLink = req.body[`donation-link`].substr(0, 128);

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream data.` });
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

module.exports = router;
