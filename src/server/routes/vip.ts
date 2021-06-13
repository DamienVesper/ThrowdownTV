import * as Express from 'express';
import User from '../models/user.model';
import Paypal from 'paypal-recurring-se';
import config from '../../../config/config';
import log from '../utils/log';
import nodemailer from 'nodemailer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface Args {
    mode: string
}

const argv = (yargs(hideBin(process.argv)).options({
    mode: { type: `string`, default: `dev` }
}).argv as Args);

// Nodemailer.
const transport = nodemailer.createTransport({
    host: `localhost`,
    port: 25,
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        password: process.env.SMTP_TOKEN
    },
    tls: {
        rejectUnauthorized: false
    }
});

const paypal = new Paypal({
    username: config.paypal.username,
    password: config.paypal.password,
    signature: config.paypal.signature
},
argv.mode === `prod` ? `production` : ``
);

const vipRouter: Express.Router = Express.Router();

vipRouter.get(`/`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: (<any>req).user.username });

    if (!user.perms.vip) res.render(`subscribeVIP.ejs`);
    else res.render(`alreadyVIP.ejs`);
});

vipRouter.get(`/success`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: (<any>req).user.username });
    paypal.createSubscription(req.query.token.toString(), req.query.PayerID.toString(), {
        AMT: 10,
        DESC: `Throwdown TV VIP Subscription`,
        BILLINGPERIOD: `Month`,
        BILLINGFREQUENCY: 1
    }, (err, data) => {
        if (!err) {
            log(`yellow`, `New Subscriber with PROFILEID: ${data.PROFILEID}`);
            user.subscription.paymentToken = req.query.token.toString();
            user.subscription.payerId = data.PROFILEID;
            user.perms.vip = true;
            user.save();
            const mailOptions = {
                from: `Throwdown TV <no-reply@throwdown.tv>`,
                to: user.email,
                subject: `You are now a VIP!`,
                text: `Hello ${user.username}, \n\nThis is to inform you that your Throwdown.TV VIP Subscription has been cancelled`
            };

            if (argv.mode === `prod`) {
                transport.sendMail(mailOptions, err => {
                    if (err) { log(`red`, err); }
                });
            }
            res.render(`success/subscriptionsuccess.ejs`);
        }
    });
});

vipRouter.get(`/failure`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    res.render(`errors/subscriptionfail.ejs`);
});

vipRouter.post(`/subscribe`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    paypal.authenticate({
        RETURNURL: config.paypal.RETURNURL,
        CANCELURL: config.paypal.CANCELURL,
        PAYMENTREQUEST_0_AMT: 10,
        L_BILLINGAGREEMENTDESCRIPTION0: `Throwdown TV VIP Subscription`
    }, (err, data, url) => {
        if (!err) { res.status(302).redirect(url); }
        log(`red`, `/subscribe POST ERROR: ${err}`);
    });
});

vipRouter.post(`/cancel`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: (<any>req).user.username });
    paypal.modifySubscription(user.subscription.payerId, `Cancel`, async (err, data) => {
        if (!err) {
            log(`yellow`, `Deleted Subscription: ${data.PROFILEID}`);
            user.perms.vip = false;
            user.save();
            const mailOptions = {
                from: `Throwdown TV <no-reply@throwdown.tv>`,
                to: user.email,
                subject: `Subscription Cancelled`,
                text: `Hello ${user.username}, \n\nThis is to inform you that your Throwdown.TV VIP Subscription has been cancelled`
            };
            if (argv.mode === `prod`) {
                transport.sendMail(mailOptions, err => {
                    if (err) { log(`red`, err); }
                });
            }
            res.redirect(`/vip/cancel/success`);
        }
    });
});

vipRouter.get(`/cancel/success`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    res.render(`errors/subscriptioncancel.ejs`);
});

export default vipRouter;
