const express = require(`express`);
const router = express.Router();
const { randomString } = require(`../utils/random.js`);
const User = require(`../models/user.model.js`);

// Multer
const multer = require(`multer`);
const multerConfig = {
    storage: multer.diskStorage({
        destination: function (req, file, next) {
            next(null, `src/client/assets/uploads/`);
        },
        filename: function (req, file, next) {
            const ext = file.mimetype.split(`/`)[1];
            next(null, `${file.fieldname}-${Date.now()}.${ext}`);
        }
    }),
    fileFilter: function (req, file, next) {
        if (!file) next();
        if (file.mimetype === `image/png` || file.mimetype === `image/jpeg` || file.mimetype === `image/jpg`) next();
        else return next();
    }
};
const upload = multer({ storage: multerConfig.storage, limits: { fileSize: `3mb` } }).single(`profilepicture`);

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
router.post(`/accountoptions/updatepfp`, (req, res) => {
    console.log(req);
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    // if (!req.file) return res.json({ errors: `Please upload a file.` });
    // if (!req.file) return res.redirect(`/dashboard`);

    upload(req, res, (err) => {
        if (err) return log(`red`, `Error Uploading File`);
    });

    /**
    const user = User.findOne({ username: req.user.username });

    user.avatarURL = `/assets/uploads/${req.user.username}/${req.file.filename}`;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        // return res.json({ success: `Succesfully updated account data.` });
        return res.redirect(`/dashboard`);
    });
    */
});

// Change Stream Key
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
