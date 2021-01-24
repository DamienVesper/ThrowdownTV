
const express = require(`express`);
const mongoose = require(`mongoose`);
const expressLayouts = require(`express-ejs-layouts`);
const passport = require(`passport`);
const flash = require(`connect-flash`);
const config = require(`../config.json`);
const User = require(`./models/User`);
const session = require(`express-session`);
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);
const favicon = require(`serve-favicon`);
const app = express();

// Passport
require(`./config/passport`)(passport);

// DB
const db = require(`./config/keys`).mongoURI;

mongoose
    .connect(
        db,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => console.log(`MongoDB Connected`))
    .catch(err => console.log(err));

// EJS
app.use (expressLayouts);
app.set(`view engine`, `ejs`);

// Bodyparser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public Folder
app.use(express.static(`public`));

// Express session
app.use(
    session({
        secret: `succan`,
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Favicon
app.use(favicon(`${__dirname  }/public/favicon.ico`));

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash(`success_msg`);
    res.locals.error_msg = req.flash(`error_msg`);
    res.locals.error = req.flash(`error`);
    next();
});

// Routes
app.use(`/`, require(`./routes/index`));
app.use(`/users`, require(`./routes/users`));
app.use(`/api`, require(`./routes/api`));
app.use(`/getvip`, require(`./routes/getvip`));

// SSL
let ssl_options = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
};

let httpServer = http.createServer(app);
let httpsServer = https.createServer(ssl_options, app);

let cf = require(`node_cloudflare`);
cf.load((error, fs_error) => {
    if (fs_error)
    {
        throw new Error(fs_error);
    }
    httpServer.listen(80);
    httpsServer.listen(443);
    console.log(`Cloudflare Server running.`);
});
