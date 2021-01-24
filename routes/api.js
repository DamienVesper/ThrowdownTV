const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const User = require('../models/User');
const config = require('../config.json')
const axios = require('axios')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')

let transporter = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "notifications@throwdown.tv", 
        pass: "Dankmeme2000", 
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Email Notification API Check
router.get('/send_notification_email/:apikey/:username', (req, res) => {
    let apikey = req.params.apikey
    let username = req.params.username
    if (apikey !== config.notificationapikey) return res.json({status: "failure"})
    User.findOne({ username: username }).then(useraccount => {
        if (!useraccount) return res.json({status: "failure"})
        useraccount.followers.forEach(async function(user) {
            await User.findOne({username: user}).then(useracc => {
                let message = {
                    from: "Throwdown TV Notifications <notifications@throwdown.tv>",
                    to: useracc.email,
                    subject: useraccount.username + " is now Live!",
                    text: `${useraccount.username} went live with the title "${useraccount.stream_title}". Watch here: https://throwdown.tv/${useraccount.username}` ,
                };
                transporter.sendMail(message, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
            })
            
        })
        res.json({status: "success"})
    })
});
// Streamkey Check
router.get('/streamkey/:streamkey', (req, res) => {
    User.findOne({ stream_key: req.params.streamkey }).then(useraccount => {
        if (useraccount) {
            if ((useraccount.can_stream || config.isPublic) && !useraccount.banned ) {
                res.json({canstream: true, username: useraccount.username})
            } else {
                res.json({canstream: false, username: useraccount.username})
            }
        } else {
            res.json({canstream: false, username: "demo"})
        }
    })
});
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
                User.findOne({username: username}).then(useraccount=> {
                    if (!useraccount) {
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
                    } else {
                        req.flash(
                            'error_msg',
                            'User Already Exists.'
                        );
                        res.redirect('/users/login');
                    }
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
                            console.log("Password reset initialized")
                            res.render('newpassword', {
                                resetlink: reset_link
                            })
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