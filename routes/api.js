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
router.get('/email_verify/:emailverificationkey', (req, res) =>
    User.findOne({ email_verification_key: req.params.emailverificationkey }).then(useraccount => {
        if (useraccount) {
            useraccount.verification_status = false;
            useraccount.save(function(err, user) {
                req.flash(
                    'success_msg',
                    'Email Successfully Verified.'
                );
                res.redirect('/users/login');
            })
        } else {
            req.flash(
                'error_msg',
                'Invalid Verification Token.'
            );
            res.redirect('/users/login');
        }
    })
);
module.exports = router;