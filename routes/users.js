const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const isAlphanumeric = require('is-alphanumeric');
const validator = require("email-validator");
const emailExistence = require("email-existence")
const jwt = require("jsonwebtoken")
const config = require('../config.json')
const Discord = require('../models/Discord');
let cf = require('node_cloudflare')

// Email
let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    auth: {
         user: 'no-reply@throwdown.tv',
         pass: config.smtp_password,
    },
    tls: {
        rejectUnauthorized: false
    }
});

function makeid(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
	   result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
 }
 
// Load User Model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Recover Page
router.get('/recover', forwardAuthenticated, (req, res) => res.render('recover'));

//Register Handle
router.post('/register', (req, res) => {
    const {password, password2} = req.body
    const username = req.body.username.toLowerCase();
    const email = req.body.email.toLowerCase();
    let errors = [];

    let bannedUsernames = ['users','dashboard','register','login','tos','browse','logout','follow','unfollow','following','streams','demo']

    //check required fields
    if(!username || !email || !password || !password2) {
        errors.push({msg: "Please fill in all fields"})
    }
    //Check email validity
    if (!validator.validate(email)) {
        errors.push({msg: "Invalid email format"})
    }
    //Check if email exists
    emailExistence.check(email, function(error, response){
        if (error) {
            errors.push({msg: "Invalid email address"})
        }
    });
    //Check if passwords match
    if(password !== password2) {
        errors.push({msg: "Passwords do not match"})
    }
    // Check Username Length
    if(username.length < 4) {
        errors.push({msg: "Username should be at least 4 characters"})
    }
    if(bannedUsernames.includes(username)){
        errors.push({msg: "Prohibited Username"})
    }
    // Check Password Length
    if(password.length < 6) {
        errors.push({msg: "Password should be at least 6 characters"})
    }
    if(!isAlphanumeric(username)) {
        errors.push({msg: "Username must be alphanumeric with no spaces"})
    }
    if(errors.length > 0) {
        res.render('register', {
            errors, 
            username,
            email,
            password,
            password2,
        })
    } else {
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', {
                    errors,
                    username,
                    email,
                    password,
                    password2,
                });
            } else {
                User.findOne({ username: username }).then(user => {
                    if (user) {
                        errors.push({ msg: 'Username already exists' });
                        res.render('register', {
                            errors,
                            username,
                            email,
                            password,
                            password2,
                        });
                    } else {
                        //JWT
                        const token = jwt.sign({username, email, password}, config.jwtToken, {expiresIn: '24h'})
                        let message = {
                            from: "Throwdown TV <no-reply@throwdown.tv>",
                            to: email,
                            subject: "Please verify your email address to use at Throwdown TV",
                            text: "Please verify your email address with this link (Expires in 24 hours): https://throwdown.tv/api/email_verify/" + token,
                        };
                        transporter.sendMail(message, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);
                        });
                        Discord.verifyEmailLogger(email);
                        req.flash(
                            'success_msg',
                            'You are now registered, Check your email for a confirmation link. Confirmation link valid for 24 hours. If you are unable to verify your account, please contact us on discord.'
                        );
                        res.redirect('/users/login');
                        /**
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
                                        'You are now registered, Check your email for a confirmation link. If you are unable to verify your account, please contact us on discord.'
                                    );
                                    User.findOne({ email: email }).then(useraccount => {
                                        let message = {
                                            from: "Throwdown TV <no-reply@throwdown.tv>",
                                            to: useraccount.email,
                                            subject: "Please verify your email address to use at Throwdown TV",
                                            text: "Please verify your email address with this link: https://throwdown.tv/api/email_verify/" + useraccount.email_verification_key,
                                        };
                                        transporter.sendMail(message, (error, info) => {
                                            if (error) {
                                                return console.log(error);
                                            }
                                            console.log('Message sent: %s', info.messageId);
                                        });
                                        res.redirect('/users/login');
                                    });
                                })
                                .catch(err => console.log(err));
                            });
                        })*/
                    }
                });
            }
        });
    }
})
// New Password
router.get('/newpassword/:resetlink', (req, res) => {
    const reset_link = req.params.resetlink
});
//Login
router.post('/login', (req, res, next) => {
    const username = req.body.username.toLowerCase();
    User.findOne({ username: username }).then(user => {
        if (!user) {
            req.flash(
                'error_msg',
                'User does not exist or has not been activated.'
            );
            res.redirect('/users/login');
        } else {
            var ip_address = cf.get(req);
            if(!user.ips.includes(ip_address)){
                user.ips.push(ip_address);
                user.save()
            }
            passport.authenticate('local', {
                successRedirect: '/dashboard',
                failureRedirect: '/users/login',
                failureFlash: true
            })(req, res, next);
        }
    })
});
// Recover
router.post('/recover', (req, res, next) => {
    const email = req.body.email.toLowerCase();
    User.findOne({ email: email }).then(user => {
        if (!user) {
            req.flash(
                'error_msg',
                'User with this email does not exist.'
            );
            res.redirect('/users/recover');
        } else {
            const token = jwt.sign({_id: user._id}, config.jwtToken_resetpassword, {expiresIn: '24h'})
            user.updateOne({reset_link: token}, (err, success) => {
                if (err) {
                    req.flash(
                        'error_msg',
                        'Unknown Error'
                    );
                    res.redirect('/users/recover');
                } else {
                    let message = {
                        from: "Throwdown TV <no-reply@throwdown.tv>",
                        to: user.email,
                        subject: "Request to Reset your Password at Throwdown TV",
                        text: "Please click the following link to reset your password. If this was not you, please ignore this email. https://throwdown.tv/api/reset_link/" + token,
                    };
                    transporter.sendMail(message, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: %s', info.messageId);
                    });
                    req.flash(
                        'success_msg',
                        'Password Reset link sent, please check your email! Link expires in 24 hours.'
                    );
                    res.redirect('/users/login');
                }
            })
        }
    })
});
// Reset password
router.post('/newpassword/:resetlink', (req, res) => {
    const reset_link = req.params.resetlink
    const password = req.body.password
    const password2 = req.body.password2

    let errors = [];

    if(password.length < 6) {
        errors.push({msg: "Password should be at least 6 characters"})
    }
    if (password !== password2) {
        errors.push({msg: "Passwords do not match"})
    }
    if(errors.length > 0) {
        res.render('register', {
            errors
        })
    } else {
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
                                bcrypt.genSalt(10, (err, salt) => {
                                    bcrypt.hash(password, salt, (err, hash) => {
                                        if (err) throw err;
                                        user.updateOne({password: hash}, (err, success) => {
                                            if (err) {
                                                req.flash(
                                                    'error_msg',
                                                    'Database Error'
                                                );
                                                res.redirect('/users/login');
                                            } else {
                                                let message = {
                                                    from: "Throwdown TV <no-reply@throwdown.tv>",
                                                    to: useraccount.email,
                                                    subject: "Password Update Notification",
                                                    text: "This email is to inform you that your password has been updated.",
                                                };
                                                transporter.sendMail(message, (error, info) => {
                                                    if (error) {
                                                        return console.log(error);
                                                    }
                                                    console.log('Message sent: %s', info.messageId);
                                                });
                                                req.flash(
                                                    'success_msg',
                                                    'Successfully changed password, you may now login!'
                                                );
                                                res.redirect('/users/login');
                                            }
                                        })
                                    })
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
    }
});
// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});
module.exports =  router;