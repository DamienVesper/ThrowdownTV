import * as Express from 'express';

import Ban from '../models/ban.model';

const banRouter: Express.Router = Express.Router();

banRouter.get(`*`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const isBanned = await Ban.findOne({ IP: req.ip });

    if (isBanned) res.render(`errors/403.ejs`);
    else next();
});

banRouter.all(`*`, async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const isBanned = await Ban.findOne({ IP: req.ip });

    if (isBanned) res.send(`403 Forbidden`).status(403);
    else next();
});

export default banRouter;
