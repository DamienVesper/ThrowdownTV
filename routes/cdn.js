const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Dashboard
router.get('/defaultavatar', (req, res) => {
    res.send("https://cdn.discordapp.com/attachments/736368923590525039/789419292214820894/defaulltpfp.png")
})
router.get('/avatar/:username', (req, res) =>
    User.findOne({ username: req.params.username }).then(useraccount => {
        if (useraccount) {
            res.send("true")
        } else {
            res.send("false")
        }
    })
);
module.exports = router;