import * as Express from 'express';
import User from '../models/user.model';

const pageRouter: Express.Router = Express.Router();

pageRouter.get(`/`, async (req: Express.Request, res: Express.Response) => req.isAuthenticated() ? res.redirect(`/browse`) : res.render(`welcome.ejs`));
pageRouter.get(`/following`, async (req: Express.Request, res: Express.Response) => req.isAuthenticated() ? res.render(`following.ejs`) : res.redirect(`/login`));
pageRouter.get(`/browse`, async (req: Express.Request, res: Express.Response) => res.render(`browse.ejs`));
pageRouter.get(`/tos`, async (req: Express.Request, res: Express.Response) => res.render(`tos.ejs`));

pageRouter.get(`/signup`, async (req: Express.Request, res: Express.Response) => req.isAuthenticated() ? res.redirect(`/`) : res.render(`signup.ejs`));
pageRouter.get(`/login`, async (req: Express.Request, res: Express.Response) => req.isAuthenticated() ? res.redirect(`/`) : res.render(`login.ejs`));

// Admin panel.
pageRouter.get(`/admin`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const accessingUser = await User.findOne({ username: (<any>req).user.username });
    if (!accessingUser.perms.staff) return res.render(`errors/403.ejs`);

    res.render(`admin.ejs`);
});

// Dashboard.
pageRouter.get(`/dashboard`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const user = await User.findOne({ username: (<any>req).user.username });
    if (!user) return res.redirect(`/logout`);
    if (user.isSuspended) return res.render(`errors/suspended.ejs`);

    res.render(`dashboard.ejs`, {
        user: user.username,
        streamTitle: user.settings.title,
        streamKey: user.settings.lockdown ? user.settings.streamKey : `You do not have permission to stream.`,
        streamDescription: user.settings.description,
        streamAvatar: user.avatarURL,
        donationLink: user.settings.donationLink
    });
});

pageRouter.get(`/recoveraccount`, async (req: Express.Request, res: Express.Response) => res.render(`accountRecovery.ejs`));

// Chat

pageRouter.get(`/global-stickers`, async (req: Express.Request, res: Express.Response) => {
    res.render(`stickers.ejs`);
});

pageRouter.get(`/chat/*`, async (req: Express.Request, res: Express.Response) => {
    const user = await User.findOne({ username: req.url.split(`/`)[2].toLowerCase() });
    if (!user) return res.redirect(`/`);

    res.render(`chat.ejs`);
});

pageRouter.get(`/report/:streamer`, async (req: Express.Request, res: Express.Response) => {
    if (!req.isAuthenticated()) return res.redirect(`/login`);

    const streamer = await User.findOne({ username: req.params.streamer.toLowerCase() });
    if (!streamer) return res.render(`errors/404.ejs`);

    res.render(`report.ejs`);
});

pageRouter.get(`/streams/donate`, async (req: Express.Request, res: Express.Response) => {
    res.render(`donate.ejs`);
});

pageRouter.get(`/contact`, async (req: Express.Request, res: Express.Response) => {
    res.render(`contact.ejs`);
});

pageRouter.get(`/:streamer`, async (req: Express.Request, res: Express.Response) => {
    const streamer = req.params.streamer;
    const user = await User.findOne({ username: streamer.toLowerCase() });
    if (!user) res.render(`errors/404.ejs`);
    else if (user.isSuspended) res.render(`errors/suspended.ejs`);
    else res.render(`streamer.ejs`);
});

export default pageRouter;
