
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
const axios = require('axios');
const socketio = require('socket.io');
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

app.get('/:channelurl', (req, res)=> {
    User.findOne({ channelurl: req.params.channelurl.toLowerCase() }).then(user => {
        if (user) {
            axios.get('http://eu01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: {username: 'admin', password: 'loltdtv2021'}})
                .then(function (response) {
                    if (response.status = 200) {
                        renderStream("eu01", user.stream_key, "application/x-mpegURL")
                    } else {
                        axios.get('http://us01.throwdown.tv/api/streams/live/' + user.stream_key, { auth: {username: 'admin', password: 'loltdtv2021'}})
                            .then(function (response) {
                                console.log(response)
                                if (response.status = 200) {
                                    renderStream("us01", user.stream_key, "application/x-mpegURL")
                                } else {
                                    renderStream("test", "offline", "video/mp4")
                                }
                            }).catch(function(error){
                                console.log(error)
                            });
                    }
                }).catch(function(error){
                    console.log(error)
                });
        } else {
            res.send(req.params.username + " Does not exist")
        }
        //Render Stream Function
        function renderStream(liveserver, streamkey, streamformat) {
            res.render('streamer', {
                user: user.username,
                streamplayer: 
                `<video id="player" class="video-js vjs-big-play-centered" controls preload="auto" fluid="true"
                    width="1280" height="720" poster="thumbnail.png" autoplay data-setup="{}">
                    <source src="https://${liveserver}.throwdown.tv/live/${streamkey}/index.m3u8"
                        type="${streamformat}" />
                    <p class="vjs-no-js">
                        To view this video please enable JavaScript, and consider upgrading to a
                        web browser that
                        <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
                    </p>
                </video>`,
                streamtitle: user.stream_title,
                streamdescription: user.stream_description,
                avatarurl: user.avatar_url,
                donationlink: user.donation_link,
                liveviewers: 0
            })
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

// Emit message on connection
const io = socketio(httpsServer);

io.on('connection', socket => {
    console.log("New Socket Connection")

    socket.on('load', function (username) {
        User.findOne({ username: username}).then(user => {
            io.emit('load', user.stream_key);
        }); 
    })

    socket.on('disconnect', () => {
        console.log("Socket Disconnected")
    })
});

httpServer.listen(80);
httpsServer.listen(443);
