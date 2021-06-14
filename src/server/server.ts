import config from '../../config/config';

import log from './utils/log';
import { logSplash, logHeader } from './utils/logExtra';

import antiDuplicator from './utils/antiDuplicator';
import clearTimeouts from './utils/clearTimeouts';
import resetRTMPServers from './utils/resetRTMPServers';

import passport from './passport';

import banRouter from './routes/ban';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import indexRouter from './routes/index';
import postRouter from './routes/post';
import widgetRouter from './routes/widget';
import vipRouter from './routes/vip';

import * as path from 'path';
import * as http from 'http';

import express from 'express';
import session from 'express-session';

import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

import helmet from 'helmet';

const ejsLayouts = require(`express-ejs-layouts`);

// Error logging.
process.on(`uncaughtException`, err => log(`red`, err.stack));

// Express app.
const app: express.Application = express();

// Express extension configurations.
app.use(express.json({ limit: `5mb` }));
app.use(express.urlencoded({ limit: `5mb`, extended: true }));

// Express session.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    })
}));

// Passport middleware.
app.use(passport.initialize());
app.use(passport.session());

// Express middleware.
app.use(ejsLayouts);
app.use(helmet({ contentSecurityPolicy: false }));

// NGINX Proxy.
app.set(`trust proxy`, true);

// Set view engine.
app.set(`views`, path.resolve(__dirname, `views`));
app.set(`view engine`, `ejs`);

// Serve the static directory.
app.use(express.static(path.resolve(__dirname, `../client`)));

// First, check if an IP is banned.
app.use(`/`, banRouter);

// Then, pass to the middleware routers.
app.use(`/`, authRouter);
app.use(`/`, postRouter);

// Then, use special routes.
app.use(`/widgets`, widgetRouter);
app.use(`/api`, apiRouter);
app.use(`/vip`, vipRouter);

// Finally, the callback route if nothing else applies (it also handles 404).
app.use(`/`, indexRouter);

// Create the webfront.
const server = http.createServer(app);

const startApp = async () => {
    logSplash(() => {
        logHeader();
        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true }).then(() => {
            log(`green`, `User authentication has connected to database.`);
            logHeader();
            server.listen(config.port, async () => {
                log(`green`, `Webfront bound to port ${config.port}.`);

                logHeader();
                import(`./chat/socket`).then(() => {
                    resetRTMPServers(() => {
                        clearTimeouts(() => {
                            antiDuplicator(() => {
                                setInterval(antiDuplicator, 18e5);
                            });
                        });
                    });
                });
            });
        });
    });
};

// Start the app.
startApp();
