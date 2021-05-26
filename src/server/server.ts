import config from '../../config/config';

import log from './utils/log';
import antiDuplicator from './utils/antiDuplicator';
import clearTimeouts from './utils/clearTimeouts';
import resetRTMPServers from './utils/resetRTMPServers';

import passport from './passport';

import apiRouter from './routes/api';
import authRouter from './routes/auth';
import indexRouter from './routes/index';
import postRouter from './routes/post';
import widgetRouter from './routes/widget';

import * as path from 'path';

import * as http from 'http';

import express from 'express';
import session from 'express-session';

import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

import helmet from 'helmet';

// Error logging.
process.on(`uncaughtException`, err => log(`red`, err.stack));

// Express app.
const app = express();

// EJS Layouts.
const ejsLayouts = require(`express-ejs-layouts`);

// Set headers.
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.includes(`/assets/img/`)) res.header(`Cache-Control`, `public, max-age=86400`);

    res.header(`Access-Control-Allow-Origin`, `*`); // This can be changed to prevent people from embedding the site on their own.
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);
    req.method.toLowerCase() === `options`
        ? res.sendStatus(200)
        : next();
});

// Database connection.
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `User authentication has connected to database.`));

// express session.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    })
}));

// Passport middleware.
app.use(passport.initialize());
app.use(passport.session());

// Express middleware.
app.use(ejsLayouts);
app.use(helmet({ contentSecurityPolicy: false }));

// Set view engine.
app.set(`views`, path.resolve(__dirname, `views`));
app.set(`view engine`, `ejs`);

// Setup NGINX proxy.
app.set(`trust proxy`, true);

// Serve the static directory.
app.use(express.static(path.resolve(__dirname, `../client`)));

// Use routes.
app.use(`/widgets`, widgetRouter);
app.use(`/api`, apiRouter);
app.use(`/`, authRouter);
app.use(`/`, postRouter);
app.use(`/`, indexRouter);

// Create the webfront.
const server = http.createServer(app);

// Run scripts on start.
antiDuplicator().then(() => clearTimeouts().then(() => resetRTMPServers()));

// Prevent duplicate stream keys.
setInterval(antiDuplicator, 18e5);

// Bind the webfront to defined port.
server.listen(config.port, () => log(`green`, `Webfront bound to port ${config.port}.`));
