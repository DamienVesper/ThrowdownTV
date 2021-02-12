const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

router.get(`/vip`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: req.user.username });

    if (!user.perms.vip) return res.render(`subscribevip.ejs`);
    else return res.render(`alreadyvip.ejs`);
});

module.exports = router;
