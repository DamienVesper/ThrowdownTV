const express = require(`express`);
const router = express.Router();
const User = require(`../models/user.model.js`);

// Landing page.
router.get(`/chat/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) return res.render(`404.ejs`);
    // res.render(`chatWidget.ejs`);
    res.send(`WIP`);
});

module.exports = router;
