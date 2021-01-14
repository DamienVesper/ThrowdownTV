const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')
const axios = require('axios')
const bcrypt = require('bcryptjs')

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
    const token = req.params.emailverificationkey;
    if (token) {
        jwt.verify(token, config.jwtToken, function(err, decodedToken) {
            if (err) {
                req.flash(
                    'error_msg',
                    'Incorrect or Expired Activiation Link'
                );
                res.redirect('/users/login');
            } else {
                const {username, email, password} = decodedToken;
                const newUser = new User({
                    username,
                    email,
                    password,
                }); 
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => {
                            req.flash(
                                'success_msg',
                                'Successfully confirmed email, you may now login!'
                            );
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                    });
                })
            }
        })
    }
    /**
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
    */
});
// Reset Link
router.get('/reset_link/:resetlink', (req, res) => {
    const reset_link = req.params.resetlink
    User.findOne({ reset_link: reset_link }).then(useraccount => {
        if (useraccount) {
            jwt.verify(reset_link, config.jwtToken_resetpassword, function(error, decodedData) {
                if (error) {
                    req.flash(
                        'error_msg',
                        'Incorrect or Expired Password Reset Link'
                    );
                    res.redirect('/users/login');
                } else {
                    User.findOne({reset_link}, (err, user) => {
                        if (err || !user) {
                            req.flash(
                                'error_msg',
                                'User with this token does not exist.'
                            );
                            res.redirect('/users/login');
                        } else {
                            res.redirect('/users/newpassword/'+reset_link)
                        }               
                    })
                }
            })
        } else {
            req.flash(
                'error_msg',
                'Database Error'
            );
            res.redirect('/users/login');
        }
    })
});
module.exports = router;