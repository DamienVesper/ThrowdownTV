const express = require('express');
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')

// Streamkey Check
router.get('/streamkey/:streamkey', (req, res) =>
    User.findOne({ stream_key: req.params.streamkey }).then(useraccount => {
        if (useraccount) {
            if ((useraccount.can_stream || config.isPublic) && !useraccount.banned ) {
                res.json({canstream: true})
                //console.log("Approved Stream Key " + req.params.streamkey)
            } else {
                res.json({canstream: false})
                //console.log("Denied Stream Key " + req.params.streamkey)
            }
        } else {
            res.json({canstream: false})
            //console.log("Denied Stream Key " + req.params.streamkey)
        }
    })
);
// Email verification check
router.get('/email_verify/:emailverificationkey', async (req, res) =>
    await User.findOne({ email_verification_key: req.params.emailverificationkey }).then(useraccount => {
        if (useraccount.verification_status) {
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
    }).catch(err => {
        req.flash(
            'error_msg',
            'UNKNOWN ERROR.'
        );
        res.redirect('/users/login');
    })
);
module.exports = router;