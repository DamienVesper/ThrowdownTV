const config = require(`../../config/config.js`);
const log = require(`./utils/log.js`);

const fs = require(`fs`);

const http = require(`http`);
const https = require(`https`);

const User = require(`./models/user.model.js`);
const Ban = require(`./models/ban.model.js`);

// Configure socket.
const server = config.mode === `prod`
    ? https.createServer({
        key: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${config.domain}/fullchain.pem`),
        requestCert: false,
        rejectUnauthorized: false
    })
    : http.createServer();

const io = require(`socket.io`)(server, {
    cors: {
        origin: config.mode === `dev` ? `http://localhost:8080` : `https://${config.domain}`,
        methods: [`GET`, `POST`],
        credentials: true
    }
});
server.listen(config.socketPort, () => log(`green`, `Socket.IO bound to port ${config.socketPort}.`));

// Handle new connections.
io.on(`connection`, async socket => {
    log(`magenta`, `A new user has connected to the chat! | IP: ${socket.handshake.address} | Origin: ${socket.request.headers.origin}.`);

    socket.on(`connectToChat`, async (username, token, streamerUsername) => {
        const user = await User.findOne({ username: username });
        const streamer = await User.findOne({ username: streamerUsername });

        // If the user or the token is incorrect, disconnect the socket.
        if (!user || user.token !== token || !streamer) {
            log(`cyan`, `Fraudential credentials provided. Disconnecting IP: ${socket.handshake.address}.`);
            return socket.disconnect();
        }

        const chatter = socket;
        chatter.channel = streamerUsername;

        // Send a handshake back to the client to let them know that we have connected.
        socket.emit(`handshake`);
    });
});

module.exports = io;
