import { name, version } from '../package.json';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface Args {
    port: number,
    socketPort: number
}

const argv = (yargs(hideBin(process.argv)).options({
    port: { type: `number`, default: 8080 },
    socketPort: { type: `number`, default: 8443 }
}).argv as Args);

const config = {
    name,

    port: argv.port,
    socketPort: argv.socketPort,

    version,
    blacklistedUsernames: [`admin`, `panel`, `adminpanel`, `moderation`, `moderation-dashboard`, `api`, `signup`, `login`, `tos`, `browse`, `following`, `dashboard`, `changestreamkey`, `widget`, `follow`, `unfollow`, `throwdown`, `vip`, `staff`, `recoveraccount`, `changepassword`, `report`],
    chatPrefix: `/`,

    paypal: {
        mode: `sandbox`,
        client_id: process.env.PAYPAL_CLIENTID,
        client_secret: process.env.PAYPAL_SECRET
    },

    discordConfig: {
        reportChannel: `811173931741347850`
    }
};

export default config;
