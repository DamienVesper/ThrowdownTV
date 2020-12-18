const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Dashboard
router.get('/streamkey/:streamkey', (req, res) =>
    User.findOne({ stream_key: req.params.streamkey }).then(useraccount => {
        if (useraccount) {
            res.send("true")
        } else {
            res.send("false")
        }
    })
);
module.exports = router;