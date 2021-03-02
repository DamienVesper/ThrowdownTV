const express = require(`express`);
const router = express.Router();
const { randomString } = require(`../utils/random.js`);
const User = require(`../models/user.model.js`);
const Ban = require(`../models/ban.model.js`);
const config = require(`../../../config/config.js`);
const { verify } = require(`hcaptcha`);

// Discord
const Discord = require(`discord.js`);
const client = new Discord.Client();
client.login(process.env.DISCORD_BOT_TOKEN);

// All POST requests are handled within this router (except authentication).
router.post(`/dashboard`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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

// Update account info
router.post(`/accountoptions/updateinfo`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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

// Update General Options
router.post(`/accountoptions/generaloptions`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);

    let notifications = true;

    const user = await User.findOne({ username: req.user.username });

    if (req.body[`allow-notifications`]) notifications = true;
    else notifications = false;

    user.settings.notifications = notifications;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated general settings.` });
    });
});

// Update Avatar
router.post(`/accountoptions/updatepfp`, async (req, res) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

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
