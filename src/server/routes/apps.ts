import * as Express from 'express';

const appsRouter: Express.Router = Express.Router();

appsRouter.get(`/android`, async (req: Express.Request, res: Express.Response) => {
    res.render(`apps/android.ejs`);
});

export default appsRouter;
