
const express = require('express')
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
const flash = require('connect-flash');
const config = require('./config.json')
const User = require('./models/User');
const session = require('express-session')
const bodyParser = require('body-parser');
const fs = require('fs')
const http = require('http');
const https = require('https');
var io = require('socket.io')(http);
const app = express()
const port = config.port

// Passport
require('./config/passport')(passport);

// Emit message on connection

io.on('connection', socket => {
    console.log("New Socket Connection")
});

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

app.get('/:channelurl', (req, res)=> {
    User.findOne({ channelurl: req.params.channelurl.toLowerCase() }).then(user => {
        if (user) {
            res.render('streamer', {
                user: user.username,
                streamkey: user.stream_key,
                streamtitle: user.stream_title,
                streamdescription: user.stream_description,
                avatarurl: user.avatar_url,
                donationlink: user.donation_link,
                liveviewers: 0
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
