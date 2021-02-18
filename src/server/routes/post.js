const express = require(`express`);
const router = express.Router();
const { randomString } = require(`../utils/random.js`);
const User = require(`../models/user.model.js`);
const config = require(`../../../config/config.js`);
const { verify } = require(`hcaptcha`);
const paypal = require(`paypal-rest-sdk`);
const log = require(`../utils/log.js`);
const Moment = require(`moment`);

// Discord
const Discord = require(`discord.js`);
const client = new Discord.Client();
client.login(process.env.DISCORD_BOT_TOKEN);

const isoDate = new Date();
isoDate.setSeconds(isoDate.getSeconds() + 4);
// eslint-disable-next-line no-unused-expressions
`${isoDate.toISOString().slice(0, 19)}Z`;

// Paypal config
paypal.configure({
    mode: process.env.PAYPAL_ENV_SANDBOX,
    client_id: process.env.PAYPAL_SANDBOX_CLIENT_ID,
    client_secret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET
});

// All POST requests are handled within this router (except authentication).
router.post(`/dashboard`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`stream-title`] || !req.body[`stream-description`] || !req.body[`donation-link`] ||
    typeof req.body[`stream-title`] !== `string` || typeof req.body[`stream-description`] !== `string` || typeof req.body[`donation-link`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: req.user.username });
    let globalStickerStatus = true;

    user.settings.title = req.body[`stream-title`].substr(0, 74);
    user.settings.description = req.body[`stream-description`].substr(0, 1000);
    user.settings.donationLink = req.body[`donation-link`].substr(0, 128);

    if (req.body[`allow-global-emotes`]) globalStickerStatus = true;
    else globalStickerStatus = false;

    user.settings.useGlobalStickers = globalStickerStatus;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream data.` });
    });
});

// Post for VIP Unsubscription
router.post(`/vip/unsubscribe`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });

    if (!user.perms.vip) return res.json({ errors: `You are not VIP` });
});

// Post for VIP Subscription
router.post(`/vip/subscribe`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });
    if (user.perms.vip) return res.json({ errors: `You are already VIP` });

    const startDate = `${Moment(new Date()).add(10, `minute`).format(`gggg-MM-DDTHH:mm:ss`)}Z`;

    const billingPlanAttributes = {
        description: `Create Plan for Regular`,
        merchant_preferences: {
            auto_bill_amount: `yes`,
            cancel_url: `http://localhost:8080/vip/cancel`,
            initial_fail_amount_action: `continue`,
            max_fail_attempts: `1`,
            return_url: `http://localhost:8080/vip/success`
        },
        name: `ThrowdownTV VIP Membership`,
        payment_definitions: [
            {
                amount: {
                    currency: `USD`,
                    value: `10`
                },
                cycles: `0`,
                frequency: `MONTH`,
                frequency_interval: `1`,
                name: `Monthly Payment`,
                type: `REGULAR`
            }
        ],
        type: `INFINITE`
    };

    const billingPlanUpdateAttributes = [
        {
            op: `replace`,
            path: `/`,
            value: {
                state: `ACTIVE`
            }
        }
    ];

    const billingAgreementAttributes = {
        name: `Name of Payment Agreement`,
        description: `Description of  your payment  agreement`,
        start_date: startDate,
        plan: {
            id: ``
        },
        payer: {
            payment_method: `paypal`
        }
    };

    paypal.billingPlan.create(billingPlanAttributes, (error, billingPlan) => {
        log(`cyan`, `Creating Billing Plan...`);
        if (error) {
            log(`red`, error);
            res.json({ errors: error });
        } else {
            log(`green`, `Create Billing Plan Response`);
            paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, (error, response) => {
                if (error) {
                    log(`red`, error);
                    res.json({ errors: error });
                } else {
                    billingAgreementAttributes.plan.id = billingPlan.id;
                    paypal.billingAgreement.create(billingAgreementAttributes, (error, billingAgreement) => {
                        if (error) {
                            log(`red`, error);
                            res.json({ errors: error });
                        } else {
                            billingAgreement.links.forEach(agreement => {
                                if (agreement.rel === `approval_url`) {
                                    // Redirecting to paypal portal with approvalUrl.
                                    const approvalUrl = agreement.href;
                                    const token = approvalUrl.split(`token=`)[1];
                                    console.log(approvalUrl, token);
                                    res.redirect(approvalUrl);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// Update account info
router.post(`/accountoptions/updateinfo`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-name`] || typeof req.body[`display-name`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    if (req.body[`display-name`].toLowerCase() !== req.user.username) return res.json({ errors: `Display Name must match the Username` });

    const user = await User.findOne({ username: req.user.username });
    user.displayName = req.body[`display-name`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account data.` });
    });
});

// Update Avatar
router.post(`/accountoptions/updatepfp`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-avatar`] || typeof req.body[`display-avatar`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: req.user.username });
    user.avatarURL = req.body[`display-avatar`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account avatar.` });
    });
});

// Change Stream Key
router.post(`/changestreamkey`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: req.user.username });
    user.settings.streamKey = `${req.user.username}${randomString(32)}`;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream key.` });
    });
});

// Follow a streamer
router.post(`/follow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (!streamer) return res.json({ errors: `That person does not exist!` });
    else if (streamer.username === req.user.username) return res.json({ errors: `You cannot follow yourself` });
    else if (streamer.followers.includes(user.username)) return res.json({ errors: `You are already following ${streamer.username}` });

    streamer.followers.push(user.username);
    streamer.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            return res.json({ success: `Succesfully Followed ${streamer.username}.` });
        }
    });
});

// Unfollow a streamer
router.post(`/unfollow/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: req.user.username });

    if (streamer.username === req.user.username) return res.json({ errors: `You cannot unfollow yourself` });
    else if (!streamer.followers.includes(user.username)) return res.json({ errors: `You do not follow ${streamer.username}` });

    streamer.followers.splice(user.followers.indexOf(streamer), 1);
    streamer.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            return res.json({ success: `Succesfully Unfollowed ${streamer.username}.` });
        }
    });
});

router.post(`/report/:streamer`, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    if (config.mode === `prod`) {
        if (req.body[`h-captcha-response`] === undefined) return res.json({ errors: `Please solve the captcha.` });
        verify(process.env.HCAPTCHA_KEY, req.body[`h-captcha-response`])
            .then((data) => {
                if (!data) return res.json({ errors: `Invalid Captcha` });
            }).catch(() => {
                return res.json({ errors: `Captcha Error` });
            });
    }
    if (!req.body[`report-comments`]) return res.json({ errors: `Report Description Empty` });
    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.json({ errors: `Streamer does not exist.` });
    // if (!streamer.live) return res.json({ errors: `Streamer is not live, please contact us on Discord if it is serious.` });
    const channel = client.channels.cache.get(config.discordconfig.reportchannel);
    const embed = new Discord.MessageEmbed()
        .setTitle(`${req.params.streamer.toLowerCase()}`)
        .setColor(`#0099ff`)
        .setURL(`http://${config.domain}/${req.params.streamer.toLowerCase()}`)
        .setAuthor(`USER REPORT`, client.user.displayAvatarURL())
        .setDescription(`TOS Category: ${req.body[`tos-category`]}`)
        .addField(`Description of Report`, req.body[`report-comments`])
        .addFields(
            { name: `Stream Title`, value: streamer.settings.title },
            { name: `Stream Description`, value: streamer.settings.description },
            { name: `Donation Link`, value: streamer.settings.donationLink }
        )
        .setImage(`https://${streamer.settings.rtmpServer}.throwdown.tv/thumbnail/${req.params.streamer.toLowerCase()}`)
        .setFooter(`Reported by: ${req.user.username}`);
    await channel.send(embed);
    res.json({ success: `Your Report was successfully sent, redirecting...` });
});

module.exports = router;
