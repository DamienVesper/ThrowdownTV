const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const email = require('emailjs');

// Email
var server  = email.server.connect({
    user:    "no-reply@throwdown.tv", 
    password: "", 
    host:    "127.0.0.1", 
    ssl:     false
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
    const {username, email, password, password2} = req.body
    let errors = [];

    //check required fields
    if(!username || !email || !password || !password2) {
        errors.push({msg: "Please fill in all fields"})
    }
    //Check if passwords match
    if(password !== password2) {
        errors.push({msg: "Passwords do not match"})
    }
    // Check Username Length
    if(username.length < 4) {
        errors.push({msg: "Username should be at least 4 characters"})
    }
    // Check Password Length
    if(password.length < 6) {
        errors.push({msg: "Password should be at least 6 characters"})
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
                            email_verification_key
                        }); 
                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser.email_verification_key = cryptoRandomString({ length: 30, type: 'alphanumeric' });
                            newUser
                                .save()
                                .then(user => {
                                    req.flash(
                                        'success_msg',
                                        'You are now registered, Check your email for a confirmation link.'
                                    );
                                    server.send({
                                        text:    "Verify your Email Address by clicking on this link: https://throwdown.tv/api/email_verify" + , 
                                        from:    emailInfo.from, 
                                        to:      emailInfo.to,
                                        subject: emailInfo.subject
                                        }, function(err, message) {
                                            callback(err);
                                    });
                                    res.redirect('/users/login');
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
    const username = req.body.username
    User.findOne({ username: username }).then(user => {
        if (user.verification_status = true) {
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