import * as Express from 'express';

import User from '../models/user.model';
import Ban from '../models/ban.model';

const pageRouter: Express.Router = Express.Router();

// Landing page.
pageRouter.get(`/`, async (req: Express.Request, res: Express.Response) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    req.isAuthenticated()
        ? res.redirect(`/browse`)
        : res.render(`welcome.ejs`);
});

// Sign Up / login pages.
pageRouter.get(`/signup`, async (req: Express.Request, res: Express.Response) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`signup.ejs`);
});

pageRouter.get(`/login`, async (req: Express.Request, res: Express.Response) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    req.isAuthenticated()
        ? res.redirect(`/`)
        : res.render(`login.ejs`);
});

// Terms of Service.
pageRouter.get(`/tos`, async (req: Express.Request, res: Express.Response) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    res.render(`tos.ejs`);
});

// Browsing.
pageRouter.get(`/browse`, async (req: Express.Request, res: Express.Response) => {
    const ip = await Ban.findOne({ IP: req.ip });
    if (ip) return res.send(`IP: ${req.ip} is blocked from accessing this page.`);

    res.render(`browse.ejs`);
});

// Staff
pageRouter.get(`/staff`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    res.render(`staff.ejs`);
});

// Admin Panel
pageRouter.get(`/admin`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });

    if (!accessingUser.perms.staff) res.send(`You must be an administrator to access this page!`);
    else res.render(`admin.ejs`);
});

// Following.
pageRouter.get(`/following`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);

    res.render(`following.ejs`);
});

// Dashboard.
pageRouter.get(`/dashboard`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: (<any>req).user.username });
    if (!user) return res.redirect(`/logout`);

    res.render(`dashboard.ejs`, {
        user: user.username,
        streamTitle: user.settings.title,
        streamKey: user.settings.lockdown ? user.settings.streamKey : `You do not have permission to stream.`,
        streamDescription: user.settings.description,
        streamAvatar: user.avatarURL,
        donationLink: user.settings.donationLink
    });
});

// Chat
pageRouter.get(`/chat/*`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    const user = await User.findOne({ username: req.url.split(`/`)[2].toLowerCase() });
    if (!user) return res.redirect(`/`);

    res.render(`chat.ejs`);
});

pageRouter.get(`/vip`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);
    const user = await User.findOne({ username: (<any>req).user.username });

    if (!user.perms.vip) return res.render(`subscribeVIP.ejs`);
    else return res.render(`alreadyVIP.ejs`);
});

pageRouter.get(`/vip/success`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);
    res.send(`Success`);
});

pageRouter.get(`/vip/cancel`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);
    res.send(`Error`);
});

pageRouter.get(`/report/:streamer`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.json({ errors: `Streamer does not exist.` });

    res.render(`report.ejs`);
});

pageRouter.get(`/:streamer`, async (req: Express.Request, res: Express.Response) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`errors/403.ejs`);

    const streamer = req.params.streamer;
    const user = await User.findOne({ username: streamer.toLowerCase() });

    if (!user || user.isSuspended) res.render(`errors/404.ejs`);
    else res.render(`streamer.ejs`);
});

export default pageRouter;
