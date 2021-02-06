const config = require(`../../config/config.js`);
const log = require(`./utils/log.js`);
const emotes = require(`../../config/emotes.js`);

const fs = require(`fs`);

const http = require(`http`);
const https = require(`https`);

const User = require(`./models/user.model.js`);
// const Ban = require(`./models/ban.model.js`);

const xssFilters = require(`xss-filters`);
const chatUsers = [];

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
            let modifiedMessage = message;

            // Whitespace detection.
            if (message.length === 0 || message.split(` `).length === (message.length + 1)) return;

            // Message all users in the channel.
            const usersToMessage = chatUsers.filter(user => user.channel === streamerUsername);

            // Emotes
            emotes.forEach(async (emote) => {
                const emoteMatch = new RegExp(`:${emote}:`, `g`);
                modifiedMessage = modifiedMessage.replace(emoteMatch, `<img class="chat-emote" src="/assets/img/emotes/${emote}.gif" alt=":${emote}:" title=":${emote}:" height="30">`);
            });

            for (const user of usersToMessage) {
                user.emit(`chatMessage`, {
                    username: chatter.username,
                    displayName: chatter.displayName,
                    message: xssFilters.inHTMLComment(modifiedMessage.substr(0, 500)),
                    badges: {
                        streamer: chatter.username === chatter.channel,
                        staff: config.staff.includes(chatter.username),
                        moderator: false,
                        verified: false,
                        vip: false
                    }
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
