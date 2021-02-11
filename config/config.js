const path = require(`path`);
const pjson = require(`../package.json`);

const config = {
    name: pjson.name,
    mode: process.env.NODE_ENV,
    port: process.env.NODE_ENV === `prod` ? 8750 : 8080,
    socketPort: 8443,
    domain: `beta.throwdown.tv`,
    version: pjson.version,
    blacklistedUsernames: [`api`, `signup`, `login`, `tos`, `browse`, `following`, `dashboard`, `changestreamkey`, `widget`, `follow`, `unfollow`, `throwdown`],
    chatPrefix: `/`
};

config.staticDir = path.resolve(__dirname, config.mode === `prod` ? `../dist` : `../src/client`);

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
};

config.paypal = {
    "mode": `sandbox`,
    "client_id": process.env.PAYPAL_CLIENTID,
    "client_secret": process.env.PAYPAL_SECRET
}

module.exports = config;
