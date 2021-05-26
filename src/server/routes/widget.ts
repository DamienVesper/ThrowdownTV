import * as Express from 'express';

import User from '../models/user.model';

const widgetRouter: Express.Router = Express.Router();

widgetRouter.get(`/chat/:streamer`, async (req, res) => {
    const streamerData = await User.findOne({ username: req.params.streamer.toLowerCase() });

    if (!streamerData) res.render(`404.ejs`);
    else res.render(`widgets/chat.ejs`);
});

export default widgetRouter;
