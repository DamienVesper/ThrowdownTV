const express = require('express');
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')

// Dashboard
router.get('/streamkey/:streamkey', (req, res) =>
    User.findOne({ stream_key: req.params.streamkey }).then(useraccount => {
        if (useraccount) {
            if (useraccount.can_stream || config.isPublic) {
                res.send("true")
            } else {
                res.send("false")
            }
        } else {
            res.send("false")
        }
    })
);
router.get('/email_verify/:emailverificationkey', (req, res) =>
    User.findOne({ email_verification_key: req.params.emailverificationkey }).then(useraccount => {
        if (useraccount) {
            if (useraccount.verification_status = false) {
                req.flash(
                    'error_msg',
                    'Email Already Verified.'
                );
                res.redirect('/users/login');
            } else {
                useraccount.verification_status = true;
                useraccount.save(function(err, user) {
                    req.flash(
                        'success_msg',
                        'Email Successfully Verified.'
                    );
                    res.redirect('/users/login');
                })
            }
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