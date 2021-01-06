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
router.get('/email_verify/:emailverificationkey', async (req, res) => {
    let useraccount = await User.findOne({email_verification_key: req.params.emailverificationkey});
    if (useraccount) {
        if(!useraccount.verification_status) {
            useraccount.verification_status = true;
            useraccount.save(async function(err, user) {
                req.flash(
                    'success_msg',
                    'Email Successfully Verified.'
                );
                res.redirect('/users/login');
            })
        } else {
            req.flash(
                'error_msg',
                'Email Already Verified.'
            );
            res.redirect('/users/login');
        }
    } else {
        req.flash(
            'error_msg',
            'Invalid Email Verification Key.'
        );
        res.redirect('/users/login');
    }
});
module.exports = router;