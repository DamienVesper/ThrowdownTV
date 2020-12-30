const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const isAlphanumeric = require('is-alphanumeric');
const cryptoRandomString = require('crypto-random-string');
const validator = require("email-validator");
const emailExistence = require("email-existence")
const config = require('../config.json')

// Email
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
         user: 'throwdowntvofficial@gmail.com',
         pass: config.smtp_password,
    }
});


// Load User Model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

//Register Handle
router.post('/register', (req, res) => {
    const {email, password, password2} = req.body
    const username = req.body.username.toLowerCase();
    let errors = [];

    let bannedUsernames = ['users','dashboard','register','login','tos','browse','logout','follow','unfollow','following','streams']

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
            password2
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
                    password2
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
                            password2
                        });
                    } else {
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
                                            from: "Throwdown TV",
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
                        });
                    }
                });
            }
        });
    }
})

//Login
router.post('/login', (req, res, next) => {
    const username = req.body.username.toLowerCase();
    User.findOne({ username: username }).then(user => {
        if (!user) {
            req.flash(
                'error_msg',
                'User does not exist.'
            );
            res.redirect('/users/login');
        }
        if (user.verification_status) {
            passport.authenticate('local', {
                successRedirect: '/dashboard',
                failureRedirect: '/users/login',
                failureFlash: true
            })(req, res, next);
        } else {
            req.flash(
                'error_msg',
                'Email not confirmed, please check your email for the conformation link sent after registration.'
            );
            res.redirect('/users/login');
        }
    })
});
// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});
module.exports =  router;