
const express = require('express')
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
const flash = require('connect-flash');
const config = require('./config.json')
const User = require('./models/User');
const session = require('express-session')
const fs = require('fs')
const http = require('http');
const https = require('https');
const app = express()
const port = config.port

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
         user: 'throwdowntvofficial@gmail.com',
         pass: config.smtp_password,
    }
});
let message = {
    from: "throwdowntvofficial@gmail.com",
    to: "rajeevkapoorofficial@gmail.com",
    subject: "Test",
    text: "Test"
};
transporter.sendMail(message, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
});

// Passport
require('./config/passport')(passport);

//DB
const db = require('./config/keys').mongoURI;

mongoose
    .connect(
        db,
        { useNewUrlParser: true ,useUnifiedTopology: true}
    )
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

//EJS
app.use (expressLayouts);
app.set('view engine', 'ejs')

//Bodyparser
app.use(express.urlencoded({extended: false}))

// Public Folder
app.use(express.static("public"));

// Express session
app.use(
    session({
        secret: 'succan',
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
  

//Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/api', require('./routes/api'))
app.use('/cdn', require('./routes/cdn'))

app.get('/:username', (req, res)=> {
    User.findOne({ username: req.params.username }).then(user => {
        if (user) {
            res.render('streamer', {
                user: user.username,
                streamkey: user.stream_key,
                streamtitle: user.stream_title,
                streamdescription: user.stream_description,
                avatarurl: user.avatar_url
            })
        } else {
            res.send(req.params.username + " Does not exist")
        }
    });
})

//SSL
var ssl_options = {
    key: fs.readFileSync( './ssl/key.pem' ),
    cert: fs.readFileSync( './ssl/cert.pem' )
}

var httpServer = http.createServer(app)
var httpsServer = https.createServer(ssl_options, app);

httpServer.listen(80);
httpsServer.listen(443);
