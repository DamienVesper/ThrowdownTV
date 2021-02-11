const express = require(`express`);
const router = express.Router();

const config = require(`../../../config/config.js`);
const paypal = require('paypal-rest-sdk');
const User = require(`../models/user.model.js`);
const log = require(`../utils/log.js`);

paypal.configure(config.paypal);

router.get(`/payment_success`, async (req, res) => {
    res.send(`Success`)
})

router.get(`/payment_success`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const payerID = req.query.PayerID;
    const paymentID = req.query.paymentId;

    const executePayment = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "10.00"
            }
        }]
    }

    paypal.payment.execute(paymentID, executePayment, (error, payment) => {
        if (error) return res.send(error);
        console.log(JSON.stringify(payment));
        res.send(`Success`)
    })
})

router.get(`/subscribe`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    return res.render(`vip.ejs`);
});

router.post(`/subscribe`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const vipPlan = {
        "description": "Throwdown TV VIP Subscription",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "https://throwdown.tv/vip/payment_cancelled",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "https://throwdown.tv/vip/payment_success",
        },
        "name": "Testing1-Regular1",
        "payment_definitions": [
            {
                "amount": {
                    "currency": "USD",
                    "value": "10"
                },
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Regular 1",
                "type": "REGULAR"
            },
        ],
        "type": "INFINITE"
    };
    paypal.payment.create(vipPlan, (error, payment) => {
        if (error) return res.json(error);
        for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === `approval_url`) {
                res.redirect(payment.links[i].href)
            }
        }       
    })
});

module.exports = router;
