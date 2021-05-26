import * as Express from 'express';
import * as HCaptcha from 'hcaptcha';

import * as Discord from 'discord.js';

import randomString from '../utils/randomString';

import User from '../models/user.model';

import config from '../../../config/config';
import log from '../utils/log';

const postRouter: Express.Router = Express.Router();
const client: Discord.Client = new Discord.Client();

client.login(process.env.DISCORD_BOT_TOKEN);
client.on(`ready`, async () => log(`green`, `Succesfully connected to Discord.`));

// All POST requests are handled within this router (except authentication).
postRouter.post(`/dashboard`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`stream-title`] || !req.body[`stream-description`] || !req.body[`donation-link`] ||
    typeof req.body[`stream-title`] !== `string` || typeof req.body[`stream-description`] !== `string` || typeof req.body[`donation-link`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: (<any>req).user.username });
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

// Update account information.
postRouter.post(`/accountoptions/updateinfo`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-name`] || typeof req.body[`display-name`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    if (req.body[`display-name`].toLowerCase() !== (<any>req).user.username) return res.json({ errors: `Display Name must match the Username` });

    const user = await User.findOne({ username: (<any>req).user.username });
    user.displayName = req.body[`display-name`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account data.` });
    });
});

// Update general options.
postRouter.post(`/accountoptions/generaloptions`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    let notifications = true;

    const user = await User.findOne({ username: (<any>req).user.username });

    if (req.body[`allow-notifications`]) notifications = true;
    else notifications = false;

    user.settings.notifications = notifications;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated general settings.` });
    });
});

// Update Avatar
postRouter.post(`/accountoptions/updatepfp`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    if (!req.body[`display-avatar`] || typeof req.body[`display-avatar`] !== `string`) return res.json({ errors: `Please fill out all fields` });

    const user = await User.findOne({ username: (<any>req).user.username });
    user.avatarURL = req.body[`display-avatar`];

    user.save(err => {
        if (err) return res.json({ errors: `Invalid account data` });
        return res.json({ success: `Succesfully updated account avatar.` });
    });
});

// Change Stream Key
postRouter.post(`/changestreamkey`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: (<any>req).user.username });
    user.settings.streamKey = `${(<any>req).user.username}_${randomString(32)}`;

    user.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream key.` });
    });
});

// Follow a streamer
postRouter.post(`/follow/:streamer`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: (<any>req).user.username });

    if (!streamer) return res.json({ errors: `That person does not exist!` });
    else if (streamer.username === (<any>req).user.username) return res.json({ errors: `You cannot follow yourself` });
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
postRouter.post(`/unfollow/:streamer`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer });
    const user = await User.findOne({ username: (<any>req).user.username });

    if (streamer.username === (<any>req).user.username) return res.json({ errors: `You cannot unfollow yourself` });
    else if (!streamer.followers.includes(user.username)) return res.json({ errors: `You do not follow ${streamer.username}` });

    streamer.followers.splice(user.followers.indexOf(streamer.username), 1);
    streamer.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        else {
            return res.json({ success: `Succesfully Unfollowed ${streamer.username}.` });
        }
    });
});

postRouter.post(`/report/:streamer`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);
    if (config.mode === `prod`) {
        if (req.body[`h-captcha-response`] === undefined) return res.json({ errors: `Please solve the captcha.` });
        HCaptcha.verify(process.env.HCAPTCHA_KEY, req.body[`h-captcha-response`])
            .then((data) => {
                if (!data) return res.json({ errors: `Invalid Captcha` });
            }).catch(() => res.json({ errors: `Captcha Error` }));
    }
    if (!req.body[`report-comments`]) return res.json({ errors: `Report Description Empty` });
    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.json({ errors: `Streamer does not exist.` });

    const channel: Discord.Channel = client.channels.cache.get(config.discordConfig.reportChannel);
    const sEmbed: Discord.MessageEmbed = new Discord.MessageEmbed()
        .setTitle(`${req.params.streamer.toLowerCase()}`)
        .setColor(`#0099ff`)
        .setURL(`https://${config.domain}/${req.params.streamer.toLowerCase()}`)
        .setAuthor(`USER REPORT`, client.user.displayAvatarURL())
        .setDescription(`TOS Category: ${req.body[`tos-category`]}`)
        .addField(`Description of Report`, req.body[`report-comments`])
        .addFields(
            { name: `Stream Title`, value: streamer.settings.title },
            { name: `Stream Description`, value: streamer.settings.description },
            { name: `Donation Link`, value: streamer.settings.donationLink }
        )
        .setImage(`https://${streamer.settings.rtmpServer}.throwdown.tv/thumbnail/${req.params.streamer.toLowerCase()}`)
        .setFooter(`Reported by: ${(<any>req).user.username}`);

    await (channel as Discord.TextChannel).send(sEmbed);
    res.json({ success: `Your Report was successfully sent, redirecting...` });
});

export default postRouter;
