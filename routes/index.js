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
      streamkey: useraccount.stream_key
    })
  })
);
router.post('/dashboard/streamkey', (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    user.stream_key = cryptoRandomString({ length: 20, type: 'alphanumeric' });
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

  if (streamtitle.length > 3){
    if (streamtitle.length <= 61){
      // Check if stream has been updated
      User.findOne({ username: req.user.username }, (err, user) => {
        user.stream_title = streamtitle;
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