const path = require(`path`);
const pjson = require(`../package.json`);

const config = {
    name: pjson.name,
    mode: process.env.NODE_ENV,
    port: process.env.NODE_ENV === `prod` ? 8750 : 8080,
    socketPort: 8443,
    domain: `beta.throwdown.tv`,
    version: pjson.version,
    staff: [`damienvesper`, `lightwarp`, `xsev`],
    blacklistedUsernames: [`api`, `signup`, `login`, `tos`, `browse`, `following`, `dashboard`, `changestreamkey`, `widget`, `follow`, `unfollow`]
};

config.staticDir = path.resolve(__dirname, config.mode === `prod` ? `../dist` : `../src/client`);

config.ssl = {
    keyPath: `/etc/letsencrypt/live/${config.domain}/privkey.pem`,
    certPath: `/etc/letsencrypt/live/${config.domain}/fullchain.pem`
};

module.exports = config;
