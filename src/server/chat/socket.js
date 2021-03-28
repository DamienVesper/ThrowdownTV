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

// Reset stats.
const resetStats = async () => {
    const users = await User.find({});
    for (const user of users) {
        user.viewers = [];
        user.live = false;
        user.save();
    }

    log(`cyan`, `Reset the viewer count and livestream status of all users.`);
};
resetStats();

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

        if (chatter.username && streamer.username !== chatter.username && !streamer.viewers.includes(chatter.username)) {
            streamer.viewers.push(chatter.username);
            streamer.save();
        }

        // Send a handshake back to the client to let them know that we have connected.
        socket.emit(`handshake`);

        // Receiving messages.
        socket.on(`chatMessage`, async message => {
            // Whitespace detection.
            if (message.length === 0 || message.split(` `).length === (message.length + 1)) return;

            const user = await User.findOne({ username });
            const streamer = await User.findOne({ username: streamerUsername });

            // Update chatter perms.
            chatter.perms = {
                streamer: chatter.username === chatter.channel,
                staff: user.perms.staff,
                moderator: streamer.channel.moderators.includes(chatter.username),
                vip: user.perms.vip
            };

            // Check if user account is suspended
            if (user.isSuspended) return chatter.emit(`commandMessage`, `Your account has been suspended.`);

            // Check if user is banned
            if (streamer.channel.bans.includes(chatter.username) || streamer.channel.timeouts.includes(chatter.username)) return chatter.emit(`commandMessage`, `You have been banned from talking in this chat.`);

            // Check if channel is on lockdown
            if (streamer.settings.lockdown === true && !streamer.channel.moderators.includes(chatter.username) && chatter.username !== streamerUsername) return chatter.emit(`commandMessage`, `Chat is currently under lockdown.`);

            // If the message is a command, then forward it to the command handler.
            if (message.slice(0, config.chatPrefix.length) === config.chatPrefix) return commandHandler.run(message, chatter, chatUsers);

            // Message all users in the channel.
            const usersToMessage = chatUsers.filter(user => user.channel === streamerUsername);
            for (const user of usersToMessage) {
                user.emit(`chatMessage`, {
                    username: chatter.username,
                    displayName: chatter.displayName,
                    message: xssFilters.inHTMLData(message.substr(0, 500)),
                    badges: chatter.perms
                });
            }
        });

        socket.on(`disconnect`, async () => {
            const streamer = await User.findOne({ username: streamerUsername });

            chatUsers.splice(chatUsers.indexOf(chatter), 1);
            log(`magenta`, `Chat Disconnection | ${chatter.username ? `Username: ${chatter.username} | ` : ``}IP: ${socket.handshake.address} | Origin: ${socket.request.headers.origin}.`);

            if (streamer.viewers.includes(chatter.username)) {
                streamer.viewers.splice(streamer.viewers.indexOf(chatter.username), 1);
                streamer.save();
            }
            return socket.disconnect();
        });
    });
});

module.exports = io;
