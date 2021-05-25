import * as Express from 'express';

import User from '../models/user.model';
import Ban from '../models/ban.model';

const widgetRouter: Express.Router = Express.Router();

widgetRouter.get(`/chat/:streamer`, async (req, res) => {
    const isBanned = await Ban.findOne({ IP: req.ip });
    if (isBanned) return res.render(`401.ejs`);

    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) res.render(`404.ejs`);
    else res.render(`widgets/chat.ejs`);
});

export default widgetRouter;
