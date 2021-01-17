const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const config = require('../config.json')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AThsb8-yGjoibhatKQhxfhNmmTvr1YhVkBI7KOBEq2lRQ0Srt8R4vQDb1fA4NztTLvCWs0idierlr_nZ',
    'client_secret': 'EJlbgcjSf62KiQbUzMLjTVcLicBaJb46KSUc0a78kugUR1czqEu69Mlp-m9gwZlCc8mTaDi6SrVBDtTV',
    'headers' : {
		'custom': 'header'
    }
});

//get vip page
router.get('/info', ensureAuthenticated, (req, res) => {
    res.render('getvip', {
        user: req.user
    });
})
  
// POST get vip
router.post('/subscribe', ensureAuthenticated, (req, res) => {
    //WIP
    res.send('WIP ;)')
})
  
module.exports = router;