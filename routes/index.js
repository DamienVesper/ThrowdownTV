const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const uniqueString = require('unique-string');
const axios = require('axios');

// Welcome Page
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/browse')
  } else {
    res.render('welcome')
  }
});

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
  const discordid = req.body.discordid

  if (streamtitle.length > 3) {
    if (streamtitle.length <= 120) {
      if (streamdescription.length > 1) {
        if (streamdescription.length <= 4000) {
          if ((streamavatar.startsWith("http://") || streamavatar.startsWith("https://")) && (streamavatar.endsWith(".png") || streamavatar.endsWith(".jpg"))) {
            if (donationlink.length > 0) {
              if (discordid.length > 0) {
                User.findOne({ username: req.user.username }, (err, user) => {
                  user.stream_title = streamtitle;
                  user.stream_description = streamdescription;
                  user.avatar_url = streamavatar;
                  user.donation_link = donationlink;
                  user.discordID = discordid;
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
                  'Discord ID link cannot be empty. if you do not have a discord account, please type something random in the text box.'
                );
                res.redirect('/dashboard');
              }
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
router.get('/browse', async (req, res) =>  {
  let streamers = []
  User.collection.find().toArray(function(err, data) {
    data.forEach(user => {
      streamers.push(user.username)
    })

    res.render('browse', {
      streamers: streamers,
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
    if (useraccount.banned) return res.render('banned', {banreason: 'Reason: "'+useraccount.banreason+'"'});
    if (useraccount.can_stream) {
      res.render('dashboard', {
        user: req.user,
        streamtitle: useraccount.stream_title,
        streamkey: useraccount.stream_key,
        streamdescription: useraccount.stream_description,
        streamavatar: useraccount.avatar_url,
        donationlink: useraccount.donation_link,
        discordid: useraccount.discordID
      })
    } else {
      res.render('dashboard', {
        user: req.user,
        streamtitle: useraccount.stream_title,
        streamkey: "You do not have permission to stream",
        streamdescription: useraccount.stream_description,
        streamavatar: useraccount.avatar_url,
        donationlink: useraccount.donation_link,
        discordid: useraccount.discordID
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
      let badge = ``
      if (user.banned) return res.render('banned', {banreason: "Ya done goofed buddy..."});
      if (user.isStaff && user.isVip) {
        badge = `<img src="https://chat.throwdown.tv:8443/img/staff" alt="[THROWDOWN STAFF]" title="Throwdown Verified Staff" width="20" height="20">    `
      } else if (user.isVip && !user.isStaff) {
        badge = `<img src="https://chat.throwdown.tv:8443/img/vip" alt="[VIP]" title="VIP" width="20" height="20">    `
      } else if (user.isStaff && !user.isVip) {
        badge = `<img src="https://chat.throwdown.tv:8443/img/staff" alt="[THROWDOWN STAFF]" title="Throwdown Verified Staff" width="20" height="20">    `
      }
      
      if (req.isAuthenticated()) {
        User.findOne({username: req.params.username.toLowerCase()}).then(status => {
          if (status.followers.includes(req.user.username)) {
            makeUnfollow();
          }
          function makeUnfollow() {
            followbutton = "Unfollow";
          }
          axios.get('http://cdn.throwdown.tv/api/streams/' + user.username)
            .then(function (response) {
              if (response.data.isLive) {
                renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", followbutton, followbutton.toLowerCase(), req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, req.user.chat_key, badge)
              } else {
                renderStream("throwdown.webm", "video/webm", followbutton, followbutton.toLowerCase(), req.params.username.toLowerCase(), "OFFLINE", "red", response.data.viewers, req.user.chat_key, badge)
              }
            });
        })
      } else {
        axios.get('http://cdn.throwdown.tv/api/streams/' + user.username)
          .then(function (response) {
            if (response.data.isLive) {
              renderStream("https://cdn.throwdown.tv/stream/" + user.username, "video/x-flv", "Follow", "follow", req.params.username.toLowerCase(), "ONLINE", "lime", response.data.viewers, "demo", badge)
            } else {
              renderStream("throwdown.webm", "video/webm", "Follow", "follow", req.params.username.toLowerCase(), "OFFLINE", "red", response.data.viewers, "demo", badge)
            }            
          })
      } 
    } else {
      res.send("Error: 404 - Not Found")
    }
    //Render Stream Function
    function renderStream(streamname, streamformat, follow_button, follow_option, username, livestatus_text, livestatus_color, stream_viewers, chat_key, badge) {
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
        liveviewers: stream_viewers,
        badge: badge,
        chatkey: chat_key
      })   
    }
  });
})
module.exports = router;