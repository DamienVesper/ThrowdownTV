import * as Express from 'express';
import * as Nodemailer from 'nodemailer';

import * as fs from 'fs';
import * as path from 'path';

import User from '../models/user.model';
import Sticker from '../models/sticker.model';

import config from '../../../config/config';
import log from '../utils/log';

const apiRouter: Express.Router = Express.Router();

// Nodemailer.
const transport = Nodemailer.createTransport({
    host: `localhost`,
    port: 25,
    secure: false,
    auth: {
        user: process.env.NOTIFICATION_SMTP_USERNAME,
        password: process.env.SMTP_TOKEN
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Load emotes.
const emotes = [];
fs.readdir(path.resolve(__dirname, `../../client/assets/img/chat/emotes`), (err, files) => {
    if (err) return log(`red`, err.stack);

    for (const emote of files) {
        emotes.push({
            name: emote.split(`.`)[0],
            extension: emote.split(`.`).pop()
        });
    }
});

apiRouter.get(`/get-emotes`, async (req: Express.Request, res: Express.Response) => res.json(emotes));

apiRouter.get(`/rtmp-api/:streamer/:apikey`, async (req: Express.Request, res: Express.Response) => {
    const streamer = req.params.streamer.toLowerCase();
    const apikey = req.params.apikey;

    const streamerData = await User.findOne({ username: streamer });

    if (!streamerData) return res.json({ errors: `Invalid User` });
    if (apikey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });

    const data = {
        username: streamerData.username,
        streamkey: streamerData.settings.streamKey,
        isLive: streamerData.live
    };

    res.json(data);
});

apiRouter.post(`/stream-status/:streamkey/:status/:apikey`, async (req: Express.Request, res: Express.Response) => {
    const streamkey = req.params.streamkey.toLowerCase();
    const status = req.params.status.toLowerCase();
    const apikey = req.params.apikey;

    const streamerData = await User.findOne({ "settings.streamKey": streamkey });
    if (!streamerData) return res.json({ errors: `Invalid User` });

    if (apikey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });

    if (status === `true`) streamerData.live = true;
    else if (status === `false`) streamerData.live = false;
    else return res.json({ errors: `Invalid Status, must be either true or false` });

    streamerData.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
        return res.json({ success: `Succesfully updated stream status.` });
    });
});

apiRouter.post(`/send-notifications`, async (req: Express.Request, res: Express.Response) => {
    const streamer = req.body.streamer;
    const apiKey = req.body.apiKey;

    if (apiKey !== process.env.NOTIFICATION_API_KEY) return res.json({ errors: `Invalid API Key` });

    const streamerData = await User.findOne({ username: streamer });
    if (!streamerData) return res.json({ errors: `Invalid User` });

    for (const follower of streamerData.followers) {
        const followerAccount = await User.findOne({ username: follower });
        if (followerAccount.settings.notifications) {
            const mailOptions = {
                from: `Throwdown TV Notifications <notifications@throwdown.tv>`,
                to: followerAccount.email,
                subject: `${streamerData.displayName} went Live!`,
                text: `${streamerData.displayName} has started broadcasting.\n\nWatch here: https://${config.domain}/${streamerData.username}`
            };

            transport.sendMail(mailOptions, err => {
                if (err) log(`red`, err);
            });
        }
    }

    res.json({ success: `Sent out notification emails for Streamer: ${streamerData.username}` });
});

apiRouter.get(`/get-stickers`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const stickerData = await Sticker.find({ ownerUsername: (<any>req).user.username });
    if (!stickerData) return res.json({ errors: `No stickers for this user` });

    const stickers = [];
    for (const sticker of stickerData) stickers.push(sticker);

    res.json(stickers);
});

apiRouter.get(`/stream-key/:streamKey`, async (req: Express.Request, res: Express.Response) => {
    const streamkey = req.params.streamKey;
    if (!streamkey) res.json({ errors: `Stream key not supplied.` });

    const streamerData = await User.findOne({ "settings.streamKey": streamkey });
    if (!streamerData) res.json({ errors: `Invalid Stream Key` });

    const data = {
        username: streamerData.username,
        verified: streamerData.verified,
        isSuspended: streamerData.isSuspended,
        isVip: streamerData.perms.vip
    };

    res.jsonp(data);
});

apiRouter.get(`/streams`, async (req: Express.Request, res: Express.Response) => {
    const streamerData = await User.find({ live: true });
    const streams = [];

    for (const streamer of streamerData) {
        streams.push({
            name: streamer.username,
            displayName: streamer.displayName,
            title: streamer.settings.title,
            description: streamer.settings.description,
            rtmpServer: streamer.settings.rtmpServer,
            isLive: streamer.live
        });
    }

    return res.json(streams);
});

apiRouter.get(`/fetch-users-no-staff`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });
    if (!accessingUser.perms.staff) return res.send(`You must be an administrator to access this page!`);

    const userData = await User.find({ "perms.staff": false });
    const users = [];

    for (const streamer of userData) {
        users.push({
            name: streamer.username,
            displayName: streamer.displayName,
            streamTitle: streamer.settings.title,
            description: streamer.settings.description,
            rtmpServer: streamer.settings.rtmpServer,
            isLive: streamer.live,
            isBanned: streamer.isSuspended,
            isVIP: streamer.perms.vip,
            email: streamer.email,
            creationIP: streamer.creationIP,
            lastIP: streamer.lastIP,
            avatarURL: streamer.avatarURL,
            channel: {
                moderators: streamer.channel.moderators,
                bans: streamer.channel.bans
            },

            emailVerified: streamer.verified,
            perms: streamer.perms
        });
    }

    return res.json(users);
});

apiRouter.get(`/fetch-user/:userToFetch`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });
    if (!accessingUser.perms.staff) return res.send(`You must be an administrator to access this page!`);

    const streamer = await User.findOne({ username: req.params.userToFetch });
    const user = {
        name: streamer.username,
        displayName: streamer.displayName,
        streamTitle: streamer.settings.title,
        description: streamer.settings.description,
        rtmpServer: streamer.settings.rtmpServer,
        isLive: streamer.live,
        isBanned: streamer.isSuspended,
        isVIP: streamer.perms.vip,
        email: streamer.email,
        creationIP: streamer.creationIP,
        lastIP: streamer.lastIP,
        avatarURL: streamer.avatarURL,
        channel: {
            moderators: streamer.channel.moderators,
            bans: streamer.channel.bans
        },

        emailVerified: streamer.verified,
        perms: streamer.perms
    };

    return res.json(user);
});

// Ban User
apiRouter.get(`/banuser/:ttusername`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });
    if (!accessingUser.perms.staff) return res.send(`You must be an administrator to access this page!`);

    const userToBan = await User.findOne({ username: req.params.ttusername });

    userToBan.isSuspended = true;
    userToBan.live = false;

    userToBan.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
    });
});

// Unban User
apiRouter.get(`/unbanuser/:ttusername`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });
    if (!accessingUser.perms.staff) return res.send(`You must be an administrator to access this page!`);

    const userToBan = await User.findOne({ username: req.params.ttusername });

    userToBan.isSuspended = false;
    userToBan.live = false;

    userToBan.save(err => {
        if (err) return res.json({ errors: `Invalid user data` });
    });
});

apiRouter.post(`/change-streamer-status`, async (req: Express.Request, res: Express.Response) => {
    const streamer = req.body.streamer;
    const apiKey = req.body.apiKey;

    const streamerStatus = req.body.streamerStatus;
    const rtmpServer = req.body.rtmpServer;

    if (apiKey !== process.env.FRONTEND_API_KEY) return res.json({ errors: `Invalid API Key` });
    else if (streamerStatus === undefined || (streamerStatus !== false && streamerStatus !== true)) return res.json({ errors: `Invalid Streamer Status` });

    const user = await User.findOne({ username: streamer });

    user.live = streamerStatus;
    user.settings.rtmpServer = rtmpServer;

    user.save(() => res.json({ success: `Changed Streamer Status` }));
});

apiRouter.get(`/following-streams`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamers = [];
    const streamerData = await User.find({ followers: (<any>req).user.username });

    for (const streamer of streamerData) {
        streamers.push({
            name: streamer.username,
            displayName: streamer.displayName,
            title: streamer.settings.title,
            description: streamer.settings.description,
            rtmpServer: streamer.settings.rtmpServer,
            isLive: streamer.live
        });
    }

    return res.json(streamers);
});

apiRouter.get(`/stream-data`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamerData = await User.findOne({ username: (<any>req).user.username });
    if (!streamerData) return res.json({ errors: `That user does not exist!` });

    const data = {
        username: streamerData.username,
        displayName: streamerData.displayName,
        streamTitle: streamerData.settings.title,
        streamDescription: streamerData.settings.description,
        donationLink: streamerData.settings.donationLink,
        streamKey: streamerData.settings.streamKey,
        viewers: streamerData.viewers,
        followers: streamerData.followers,
        avatarURL: streamerData.avatarURL,
        isVip: streamerData.perms.vip,
        isStaff: streamerData.perms.staff,
        allowGlobalEmotes: streamerData.settings.useGlobalStickers,
        notifications: streamerData.settings.notifications
    };

    res.jsonp(data);
});

apiRouter.get(`/public-stream-data/:streamer`, async (req: Express.Request, res: Express.Response) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamerData) res.render(`404.ejs`);

    const data = {
        username: streamerData.username,
        displayName: streamerData.displayName,
        streamTitle: streamerData.settings.title,
        streamDescription: streamerData.settings.description,
        donationLink: streamerData.settings.donationLink,
        isSuspended: streamerData.isSuspended,
        viewers: streamerData.viewers,
        followers: streamerData.followers,
        avatarURL: streamerData.avatarURL,
        isVip: streamerData.perms.vip,
        isStaff: streamerData.perms.staff,
        isLive: streamerData.live,
        rtmpServer: streamerData.settings.rtmpServer
    };

    res.jsonp(data);
});

apiRouter.get(`/get-followers/:streamer`, async (req: Express.Request, res: Express.Response) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamerData) res.render(`404.ejs`);

    const data = {
        followers: streamerData.followers
    };

    res.jsonp(data);
});

export default apiRouter;
