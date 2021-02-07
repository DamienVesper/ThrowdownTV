const config = require(`../../../config/config.js`);
const log = require(`../utils/log.js`);

const fs = require(`fs`);

const http = require(`http`);
const https = require(`https`);

const User = require(`../models/user.model.js`);

const xssFilters = require(`xss-filters`);
const chatUsers = [];

const commandHandler = require(`./commandHandler.js`);

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
    log(`magenta`, `Chat Connection | IP: ${socket.handshake.address} | Origin: ${socket.request.headers.origin}.`);

    socket.on(`connectToChat`, async (username, token, streamerUsername) => {
        const user = await User.findOne({ username });
        const streamer = await User.findOne({ username: streamerUsername });

        // If the user or the token is incorrect, disconnect the socket.
        if (!user || user.token !== token || !streamer) log(`cyan`, `Guest account connected.`);

        const chatter = socket;
        chatter.username = username;
        chatter.displayName = user ? user.displayName : undefined;

        chatter.token = token;
        chatter.channel = streamerUsername;

        chatUsers.push(chatter);

        // Send a handshake back to the client to let them know that we have connected.
        socket.emit(`handshake`);

        // Receiving messages.
        socket.on(`chatMessage`, message => {
            // Whitespace detection.
            if (message.length === 0 || message.split(` `).length === (message.length + 1)) return;

            // If the message is a command, then forward it to the command handler.
            if (message.slice(0, config.chatPrefix.length) === config.chatPrefix) return commandHandler.run(message, chatter, chatUsers);

            // Message all users in the channel.
            const usersToMessage = chatUsers.filter(user => user.channel === streamerUsername);

            // Update chatter perms.
            chatter.perms = {
                streamer: chatter.username === chatter.channel,
                staff: config.perms.staff.includes(chatter.username),
                moderator: streamer.channel.moderators.includes(chatter.username),
                verified: config.perms.verified.includes(chatter.username),
                vip: streamer.channel.vips.includes(chatter.username)
            };

            for (const user of usersToMessage) {
                user.emit(`chatMessage`, {
                    username: chatter.username,
                    displayName: chatter.displayName,
                    message: xssFilters.inHTMLData(message.substr(0, 500)),
                    badges: chatter.perms
                });
            }
        });

        socket.on(`disconnect`, () => {
            delete chatUsers[chatUsers.indexOf(chatter)];
            log(`magenta`, `Chat Disconnection | ${chatter.username ? `Username: ${chatter.username} | ` : ``}IP: ${socket.handshake.address} | Origin: ${socket.request.headers.origin}.`);
            return socket.disconnect();
        });
    });
});

module.exports = io;
