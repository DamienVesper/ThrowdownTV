
const express = require('express')
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
const flash = require('connect-flash');
const config = require('./config.json')
const User = require('./models/User');
const session = require('express-session')
const fs = require('fs')
const https = require('https')
const app = express()
const port = config.port

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


https.createServer(ssl_options, app).listen(port, function(){
    console.log("Throwdown TV server listening on port " + port);
});
