const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  User.findOne({ username: req.user.username }).then(useraccount => {
    res.render('dashboard', {
      user: req.user,
      streamtitle: useraccount.stream_title
    })
  })
);
router.post('/dashboard', (req, res) => {
  const streamtitle = req.body.streamtitle

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
  })
})
module.exports = router;