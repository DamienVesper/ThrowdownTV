import { name, version } from '../package.json';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as dotenv from 'dotenv';
dotenv.config();

interface Args {
    mode: string
}

const argv = (yargs(hideBin(process.argv)).options({
    mode: { type: `string`, default: `dev` }
}).argv as Args);

const config = {
    name,
    mode: argv.mode,

    domain: `throwdown.tv`,

    port: argv.mode === `prod` ? 8750 : 8080,
    socketPort: 8443,

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
