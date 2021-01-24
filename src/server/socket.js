const config = require(`../../config/config.js`);
const log = require(`./utils/log.js`);

const fs = require(`fs`);

const http = require(`http`);
const https = require(`https`);

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

module.exports = io;
