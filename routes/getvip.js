const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
var paypal = require('paypal-rest-sdk');
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
    /**
    var billingPlanAttributes = {
        "description": "Throwdown TV VIP Subscription (10 USD MONTHLY)",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "https://throwdown.tv/getvip/cancel",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "https://throwdown.tv/getvip/success",
        },
        "name": "VIP Subscription",
        "payment_definitions": [
            {
                "amount": {
                    "currency": "USD",
                    "value": "10"
                },
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Monthly",
                "type": "REGULAR"
            },
        ],
        "type": "INFINITE"
    };
    paypal.billingPlan.create(billingPlanAttributes, function (error, billingPlan) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log(billingPlan);
            for (let i = 0; i > billingPlan.links.length; i++) {
                if (billingPlan.links[i].rel === 'self') {
                    res.redirect(billingPlan.links[i].href)
                }
            }
        }
    });
    */
})
  
module.exports = router;