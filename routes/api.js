const express = require('express');
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')

// Streamkey Check
router.get('/streamkey/:streamkey', (req, res) =>
    User.findOne({ stream_key: req.params.streamkey }).then(useraccount => {
        if (useraccount) {
            if (useraccount.can_stream || config.isPublic) {
                res.json({canstream: true})
                console.log("Approved Stream Key " + req.params.streamkey)
            } else {
                res.json({canstream: false})
                console.log("Denied Stream Key " + req.params.streamkey)
            }
        } else {
            res.json({canstream: false})
            console.log("Denied Stream Key " + req.params.streamkey)
        }
    })
);
<<<<<<< Updated upstream
router.get('/chat/:username/:token', (req, res) =>
    User.findOne({ username: req.params.username }).then(useraccount => {
        if (useraccount) {
            if (useraccount.token = req.params.token) {
                res.json({canstream: true})
            } else {
                res.json({canstream: false})
            }
        } else {
            res.json({canchat: false})
        }
    })
);
=======

// Email verify
>>>>>>> Stashed changes
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