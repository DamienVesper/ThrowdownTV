require(`dotenv`).config();

// Configuration.
const config = require(`../../config/config.js`);
require(`dotenv`).config();

// Utilities.
const log = require(`./utils/log.js`);
const antiDuplicator = require(`./utils/antiDuplicator.js`);
const clearTimeouts = require(`./utils/clearTimeouts.js`);
const resetRTMPServers = require(`./utils/resetRTMPServers.js`);

const fs = require(`fs`);
const path = require(`path`);

// Log errors in a different color.
process.on(`uncaughtException`, err => log(`red`, err.stack));

// Socket.IO server.
const io = require(`./chat/socket.js`);

// HTTP / HTTPS transport protocols.
const https = require(`https`);
const http = require(`http`);

// Express app.
const express = require(`express`);
const app = express();

// Express middleware.
const session = require(`express-session`);
const bodyParser = require(`body-parser`);
const compression = require(`compression`);
const ejsLayouts = require(`express-ejs-layouts`);

// Passport.
const passport = require(`./passport.js`);

// Database connection.
const MongoStore = require(`connect-mongo`)(session);
const mongoose = require(`mongoose`);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `User authentication has connected to database.`));

// Define express routes.
const apiRouter = require(`./routes/api`);
const authRouter = require(`./routes/auth`);
const indexRouter = require(`./routes/index`);
const postRouter = require(`./routes/post`);
const widgetRouter = require(`./routes/widget`);

// Set headers.
app.use((req, res, next) => {
    if (req.path.includes(`/assets/img/`)) res.header(`Cache-Control`, `public, max-age=86400`);

    res.header(`Access-Control-Allow-Credentials`, true);
    res.header(`Access-Control-Allow-Origin`, `*`); // This can be changed to prevent people from embedding the site on their own.
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);
    req.method.toLowerCase() === `options`
        ? res.sendStatus(200)
        : next();
});

// Express session.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

// Passport middleware.
app.use(passport.initialize());
app.use(passport.session());

// Express middleware.
app.use(compression());
app.use(ejsLayouts);

app.use(bodyParser.json({
    limit: `50mb`
}));

app.use(bodyParser.urlencoded({
    limit: `50mb`,
    extended: true
}));

// Set view engine.
app.set(`views`, path.resolve(__dirname, `views`));
app.set(`view engine`, `ejs`);

// Setup NGINX proxy.
app.set(`trust proxy`, true);

// Serve the static directory.
console.log(config.staticDir);
app.use(express.static(config.staticDir));

// Use routes.
app.use(`/widgets`, widgetRouter);
app.use(`/api`, apiRouter);
app.use(`/`, authRouter);
app.use(`/`, postRouter);
app.use(`/`, indexRouter);

// Create the webfront.
const server = config.mode === `dev`
    ? http.createServer(app)
    : https.createServer({
        key: fs.readFileSync(config.ssl.keyPath),
        cert: fs.readFileSync(config.ssl.certPath),
        requestCert: false,
        rejectUnauthorized: false
    }, app);

// Make sure there are no duplicates.
antiDuplicator();
setInterval(antiDuplicator, 18e5);

// Clear Timed out users.
clearTimeouts();

// Reset RTMP Servers of all users
resetRTMPServers();

// Bind the webfront to defined port.
server.listen(config.port, () => log(`green`, `Webfront bound to port ${config.port}.`));

module.exports = {
    server,
    app,
    io
};
