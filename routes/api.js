const express = require('express');
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')
const axios = require('axios')

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
    await axios.get('http://cdn.throwdown.tv/api/streams/' + req.params.emailverificationkey)
        .then(async function (response) {
            if (response.data.verification_status) {
                req.flash(
                    'error_msg',
                    'Email Already Verified.'
                );
                res.redirect('/users/login');
            } else {
                const filter = {email_verification_key: req.params.emailverificationkey}
                const update = {verification_status: true}
                await User.findOneAndUpdate(filter, update, {new: true}, (err, doc) => {
                    if (!err) {
                        req.flash(
                            'success_msg',
                            'Email Successfully Verified.'
                        );
                        res.redirect('/users/login');
                    } else {
                        req.flash(
                            'error_msg',
                            'Error...'
                        );
                        res.redirect('/users/login');
                    }
                })
            }
        });
});
module.exports = router;