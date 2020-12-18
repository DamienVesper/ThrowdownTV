const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const cryptoRandomString = require('crypto-random-string');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  User.findOne({ username: req.user.username }).then(useraccount => {
    res.render('dashboard', {
      user: req.user,
      streamtitle: useraccount.stream_title,
      streamkey: useraccount.stream_key,
      streamdescription: useraccount.stream_description,
      streamavatar: useraccount.avatar_url,
      donationlink: useraccount.donation_link
    })
  })
);

router.post('/dashboard/streamkey', (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    user.stream_key = cryptoRandomString({ length: 50, type: 'alphanumeric' });
    user.save(function(err, user) {
      req.flash(
        'success_msg',
        'Stream Key succesfully reset.'
      );
      res.redirect('/dashboard');
    })
  });
})
router.post('/dashboard', (req, res) => {
  const streamtitle = req.body.streamtitle
  const streamdescription = req.body.streamdescription
  const streamavatar = req.body.streamavatar
  const donationlink = req.body.donationlink

  if (streamtitle.length > 3){
    if (streamtitle.length <= 61){
      if (streamdescription.length > 1) {
        if (streamdescription.length <= 4000) {
          if (streamavatar.startsWith("http://")||streamavatar.startsWith("https://")) {
            if (donationlink.length > 0) {
              User.findOne({ username: req.user.username }, (err, user) => {
                user.stream_title = streamtitle;
                user.stream_description = streamdescription;
                user.avatar_url = streamavatar
                user.donation_link = donationlink
                user.save(function(err, user) {
                  req.flash(
                    'success_msg',
                    'Changes succesfully updated.'
                  );
                  res.redirect('/dashboard');
                })
              });
            } else {
              req.flash(
                'error_msg',
                'Donation link cannot be empty.'
              );
              res.redirect('/dashboard');
            }
          } else {
            req.flash(
              'error_msg',
              'Stream avatar must be a valid image URL.'
            );
            res.redirect('/dashboard');
          }
        } else {
          req.flash(
            'error_msg',
            'Stream description must not be longer than 4000 Characters.'
          );
          res.redirect('/dashboard');
        } 
      } else {
        req.flash(
          'error_msg',
          'Stream description must be longer than 1 Characters.'
        );
        res.redirect('/dashboard');
      }
    } else {
      req.flash(
        'error_msg',
        'Stream title must not be longer than 61 Characters.'
      );
      res.redirect('/dashboard');
    }
  } else {
    req.flash(
      'error_msg',
      'Stream title must be longer than 3 Characters.'
    );
    res.redirect('/dashboard');
  }
})
module.exports = router;