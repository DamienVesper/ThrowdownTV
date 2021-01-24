const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const config = require('../config.json')

//get vip page
router.get('/info', ensureAuthenticated, (req, res) => {
    res.render('getvip', {
        user: req.user
    });
})
  
// POST get vip
router.post('/subscribe', ensureAuthenticated, (req, res) => {
    //WIP
    res.redirect('https://www.patreon.com/ThrowdownTV')
})
  
module.exports = router;