const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const uniqueString = require('unique-string');
const axios = require('axios');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// TOS
router.get('/tos', (req, res) => res.render('tos'));

router.post('/dashboard/streamkey', (req, res) => {
  User.findOne({ username: req.user.username }, (err, user) => {
    user.stream_key = uniqueString();
    user.save(function (err, user) {
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

  if (streamtitle.length > 3) {
    if (streamtitle.length <= 61) {
      if (streamdescription.length > 1) {
        if (streamdescription.length <= 4000) {
          if (streamavatar.startsWith("http://") || streamavatar.startsWith("https://")) {
            if (donationlink.length > 0) {
              User.findOne({ username: req.user.username }, (err, user) => {
                user.stream_title = streamtitle;
                user.stream_description = streamdescription;
                user.avatar_url = streamavatar
                user.donation_link = donationlink
                user.save(function (err, user) {
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

// Default donation link ;)
router.get('/streams/donate', (req, res) => {
  res.send("This user has not set up their donation link yet :(")
})

// Browsing
router.get('/browse', (req, res) =>  {
  let onlineStreamers = []
  let offlineStreamers = []
  User.collection.find().toArray(function(err, data) {
    data.forEach(user => {
      if (checkIfLive(user.username)) {
        onlineStreamers.push(user.username) 
      } else {
        offlineStreamers.push(user.username)
      }
      function checkIfLive(username) {
        var result = false
        const response = axios.get('https://cdn.throwdown.tv/api/streams/' + username).then(function (response) {
          if (response.data.isLive) {
            result = true;
          }
        })
        return result;
      }
      
    })
    console.log(onlineStreamers)
    console.log(offlineStreamers)
    res.render('browse', {
      onlinestreamer: onlineStreamers,
      offlinestreamer: offlineStreamers
    })
  })
})

// Following
router.get('/following', ensureAuthenticated, (req, res) =>  {
  User.findOne({ username: req.user.username }).then(useraccount => {
    res.render('following', {
      following: useraccount.following,
    })
  })
})

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  User.findOne({ username: req.user.username }).then(useraccount => {
    if (useraccount.banned) return res.render('banned');
    if (useraccount.can_stream) {
      res.render('dashboard', {
        user: req.user,
        streamtitle: useraccount.stream_title,
        streamkey: useraccount.stream_key,
        streamdescription: useraccount.stream_description,
        streamavatar: useraccount.avatar_url,
        donationlink: useraccount.donation_link
      })
    } else {
      res.render('dashboard', {
        user: req.user,
        streamtitle: useraccount.stream_title,
        streamkey: "You do not have permission to stream",
        streamdescription: useraccount.stream_description,
        streamavatar: useraccount.avatar_url,
        donationlink: useraccount.donation_link
      })
    }
  })
});

//Unfollow user
router.get('/unfollow/:username', ensureAuthenticated, (req, res) => {
  User.findOne({ username: req.params.username }).then(followaccount => {
    User.findOne({followers: req.user.username, username: req.params.username}).then(isFollowing => {
      if (!isFollowing) {
        req.flash(
          'error_msg',
          'Not following '+req.params.username+'.'
        );
        res.redirect('/'+req.params.username);
      } else {
        followaccount.followers.pull(req.user.username)
        followaccount.save()
        User.findOne({ username: req.user.username }).then(followeraccount => {
          followeraccount.following.pull(req.params.username)
          followeraccount.save();
          req.flash(
            'success_msg',
            'Successfully unfollowed '+req.params.username+'.'
          );
          res.redirect('/'+req.params.username);
        })  
      }
    })
  })
})

//Follow user
router.get('/follow/:username', ensureAuthenticated, (req, res) => {
  User.findOne({username: req.user.username}).then(myaccount => {
    User.findOne({ username: req.params.username.toLowerCase() }).then(followaccount => {
      User.findOne({followers: myaccount.username, username: followaccount.username}).then(isFollowing => {
        if (myaccount.username == followaccount.username){
          req.flash(
            'error_msg',
            "You can't follow yourself"
          );
          res.redirect('/'+req.params.username);
        } else {
          if (isFollowing) { 
            req.flash(
              'error_msg',
              'Already following '+req.params.username+'.'
            );
            res.redirect('/'+req.params.username);
          } else {
            followaccount.followers.push(req.user.username)
            followaccount.save()
            User.findOne({ username: req.user.username }).then(followeraccount => {
              followeraccount.following.push(req.params.username)
              followeraccount.save();
              req.flash(
                'success_msg',
                'Successfully followed '+req.params.username+'.'
              );
              res.redirect('/'+req.params.username);
            })  
          }
        }
      })
    })
  })
})

// Streamer
router.get('/:username', (req, res) => {
  let followbutton = "Follow";
  User.findOne({ username: req.params.username.toLowerCase() }).then(user => {
    if (user) {
      if (user.banned) return res.render('banned');
      if (req.isAuthenticated()) {
        User.findOne({username: req.params.username.toLowerCase()}).then(status => {
          if (status.followers.includes(req.user.username)) {
            makeUnfollow();
          }
          function makeUnfollow() {
            followbutton = "Unfollow";
          }
          //renderStream("https://cdn.throwdown.tv/" + user.username, "video/x-flv", followbutton, followoption, req.params.username.toLowerCase(), "ONLINE", "lime", 0, user.chat_token)
          axios.get('http://eu01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: { username: 'admin', password: 'loltdtv2021' } })
            .then(function (response) {
              if (response.data.isLive) {
                renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", followbutton, followbutton.toLowerCase(), req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, user.chat_token)
              } else {
                axios.get('http://us01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: { username: 'admin', password: 'loltdtv2021' } })
                  .then(function (response) {
                    if (response.data.isLive) {
                      renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", followbutton, followbutton.toLowerCase(), req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, user.chat_token)
                    } else {
                      renderStream("throwdown.mp4", "video/mp4", followbutton, followbutton.toLowerCase(), req.params.username.toLowerCase(), "OFFLINE", "red", response.data.viewers)
                    }
                })
              }
            });
        })
      } else {
        //renderStream("https://cdn.throwdown.tv/" + user.username , "video/x-flv", "Follow", "follow", req.params.username.toLowerCase(), "ONLINE", "lime", 0, user.chat_token)
        axios.get('http://eu01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: { username: 'admin', password: 'loltdtv2021' } })
          .then(function (response) {
            if (response.data.isLive) {
              renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", "Follow", "follow", req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, user.chat_token)
            } else {
              axios.get('http://us01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: { username: 'admin', password: 'loltdtv2021' } })
                .then(function (response) {
                  if (response.data.isLive) {
                    renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", "Follow", "follow", req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, user.chat_token)
                  } else {
                    renderStream("throwdown.mp4", "video/mp4", "Follow", "follow", req.params.username.toLowerCase(), "OFFLINE", "red", response.data.viewers)
                  }            
                })
            }            
          })
      } 
    } else {
      res.send("Error: 404 - Not Found")
    }
    //Render Stream Function
    function renderStream(streamname, streamformat, follow_button, follow_option, username, livestatus_text, livestatus_color, stream_viewers, chat_token) {
      res.render('streamer', {
        user: user.username,
        streamlink: streamname,
        streamformat: streamformat,
        followbutton: 
        `<form  style="margin: 10px;" action="/${follow_option}/${username}">
          <button id="follow_button" type="submit" class="btn btn-success">${follow_button}</button>
        </form>`,
        livestatus: `<p style="color: ${livestatus_color};">${livestatus_text}</p>`,
        streamtitle: user.stream_title,
        followercount: user.followers.length,
        streamdescription: user.stream_description,
        avatarurl: user.avatar_url,
        donationlink: user.donation_link,
        chattoken: chat_token,
        liveviewers: stream_viewers
      })   
    }
  });
})
module.exports = router;